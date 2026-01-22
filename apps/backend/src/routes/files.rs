use std::{ffi::OsStr, path::PathBuf};

use anyhow::anyhow;
use axum::{
    Json, Router,
    body::Bytes,
    extract::{DefaultBodyLimit, Multipart, Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, patch, post},
};
use axum_extra::response::FileStream;
use sanitize_filename::is_sanitized;
use serde::Deserialize;
use tokio::io::AsyncWriteExt;
use tokio_util::io::ReaderStream;
use tracing::error;

use crate::{
    error::Error,
    models::{
        collection::Collection,
        file::{File, FileWithCollections},
        session::Session,
    },
    services::thumbnails::{ThumbnailError, generate_thumbnail},
    state::AppState,
    types::Uid,
};

async fn index(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
) -> Result<Json<Vec<File>>, Error> {
    let files = File::get_all_for_user(&pool, session.user_id).await?;

    Ok(Json(files))
}

async fn show(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
    Path(file_id): Path<Uid>,
) -> Result<Json<FileWithCollections>, Error> {
    let file = FileWithCollections::get_by_public_id(&pool, session.user_id, &file_id)
        .await?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    Ok(Json(file))
}

// TODO: Upload quota per user
async fn create(
    State(AppState { pool, dirs, .. }): State<AppState>,
    session: Session,
    mut multipart: Multipart,
) -> Result<Json<File>, Error> {
    let mut collection_id: Option<Uid> = None;
    let mut file: Option<(String, Bytes)> = None;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| Error::Internal(e.into()))?
    {
        match field.name() {
            Some("collection") => {
                collection_id = Some(
                    field
                        .text()
                        .await
                        .map_err(|_| Error::BadRequest("Bad request"))
                        .and_then(|text| {
                            Uid::try_from(text).map_err(|_| Error::BadRequest("Bad request"))
                        })?,
                );
            }
            Some("file") => {
                let file_name = field
                    .file_name()
                    .map(|s| s.to_owned())
                    .ok_or(Error::UnprocessableEntity("Missing file name"))?;

                // TODO: Don't read everything into memory?
                let file_bytes = field.bytes().await.map_err(|e| Error::Internal(e.into()))?;

                file = Some((file_name, file_bytes));
            }
            _ => (),
        }
    }

    let Some((original_name, file_bytes)) = file else {
        return Err(Error::UnprocessableEntity("Expected a file."));
    };

    // TODO: retry on db collision
    let file_id = Uid::new(6);
    let ext = std::path::Path::new(&original_name)
        .extension()
        .and_then(OsStr::to_str)
        .map(|p| ".".to_string() + p)
        .unwrap_or("".to_string());

    let file_name = file_id.to_string() + &ext;
    let file_path = dirs.uploads_dir().join(&file_name);
    let file_size = file_bytes.len();

    let mut transaction = pool.begin().await?;

    let file = File::create(
        &mut *transaction,
        session.user_id,
        &file_id,
        &file_name,
        &original_name,
        &file_size,
    )
    .await?;

    if let Some(collection_id) = collection_id {
        Collection::add_file(
            &mut *transaction,
            session.user_id,
            &collection_id,
            &file.public_id,
        )
        .await?
        .ok_or_else(|| Error::NotFound("Collection not found or not owned by user."))?;
    }

    let mut file_handle = tokio::fs::File::create_new(&file_path)
        .await
        .map_err(|e| Error::Internal(e.into()))?;

    file_handle
        .write_all(&file_bytes)
        .await
        .map_err(|e| Error::Internal(e.into()))?;

    match generate_thumbnail(&file_path, dirs.thumbs_dir()).await {
        Ok(_) | Err(ThumbnailError::UnsupportedFiletype) => (),
        Err(ThumbnailError::ShellError(err)) => {
            error!("Error creating thumbnail for \"{:?}\": {}", file_path, err)
        }
    }

    transaction.commit().await?;

    Ok(Json(file))
}

#[derive(Debug, Deserialize)]
pub struct RenameFilePayload {
    pub name: String,
}

async fn rename(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
    Path(file_id): Path<Uid>,
    Json(body): Json<RenameFilePayload>,
) -> Result<Json<File>, Error> {
    let name = body.name.trim();

    if name.is_empty() {
        return Err(Error::UnprocessableEntity("File name must not be empty."));
    }

    if !is_sanitized(name) {
        return Err(Error::UnprocessableEntity(
            "File name contains invalid characters.",
        ));
    }

    let file = File::get_by_public_id(&pool, session.user_id, &file_id)
        .await?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    let old_ext = std::path::Path::new(&file.filename).extension();
    let new_ext = std::path::Path::new(&name).extension();

    if old_ext != new_ext {
        return Err(Error::UnprocessableEntity(
            "New file extension much match the old one.",
        ));
    }

    let file = File::rename(&pool, session.user_id, &file_id, name)
        .await?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    Ok(Json(file))
}

async fn remove(
    State(AppState { pool, dirs, .. }): State<AppState>,
    session: Session,
    Path(file_id): Path<Uid>,
) -> Result<StatusCode, Error> {
    let file = File::delete(&pool, session.user_id, &file_id)
        .await?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    let thumb_name = PathBuf::from(&file.filename).with_extension("avif");

    let file_path = dirs.uploads_dir().join(&file.filename);
    let thumb_path = dirs.thumbs_dir().join(thumb_name);

    let _ = tokio::fs::remove_file(&file_path)
        .await
        .inspect_err(|err| error!("Error deleting file \"{:?}\": {}", file_path, err));
    let _ = tokio::fs::remove_file(&thumb_path)
        .await
        .inspect_err(|err| error!("Error deleting file \"{:?}\": {}", thumb_path, err));

    Ok(StatusCode::NO_CONTENT)
}

async fn download(
    State(AppState { pool, dirs, .. }): State<AppState>,
    session: Session,
    Path(file_id): Path<Uid>,
) -> Result<impl IntoResponse, Error> {
    let file = File::get_by_public_id(&pool, session.user_id, &file_id)
        .await?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    let file_path = dirs.uploads_dir().join(&file.filename);
    let file_stream = FileStream::<ReaderStream<tokio::fs::File>>::from_path(file_path)
        .await
        .map_err(|_| Error::NotFound("File not found or not owned by user."))?
        .file_name(file.name);

    Ok(file_stream)
}

async fn regenerate_thumbnail(
    State(AppState { pool, dirs, .. }): State<AppState>,
    session: Session,
    Path(file_id): Path<Uid>,
) -> Result<impl IntoResponse, Error> {
    let file = File::get_by_public_id(&pool, session.user_id, &file_id)
        .await?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    let file_path = dirs.uploads_dir().join(file.filename);

    let thumb_file_name = generate_thumbnail(&file_path, dirs.thumbs_dir())
        .await
        .map_err(|err| match err {
            ThumbnailError::UnsupportedFiletype => {
                Error::BadRequest("Filetype doesn't support thumbnails.")
            }
            ThumbnailError::ShellError(err) => Error::Internal(anyhow!(
                "Error creating thumbnail for \"{:?}\": {}",
                file_path,
                err
            )),
        })?;

    Ok((
        StatusCode::CREATED,
        [("Location", format!("/thumbs/{}", thumb_file_name))],
    ))
}

pub fn routes(state: &AppState) -> Router<AppState> {
    let AppState { settings, .. } = state;

    Router::new()
        .route("/", get(index))
        .route("/{id}", get(show))
        .route(
            "/",
            post(create).layer(DefaultBodyLimit::max(settings.max_file_size)),
        )
        .route("/{id}", patch(rename))
        .route("/{id}", delete(remove))
        .route("/{id}/download", get(download))
        .route("/{id}/regenerate-thumbnail", post(regenerate_thumbnail))
}
