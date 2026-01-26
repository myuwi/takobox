use std::{ffi::OsStr, path::PathBuf};

use anyhow::anyhow;
use salvo::{
    fs::NamedFile,
    http::header::{self, HeaderValue},
    oapi::extract::{FormFile, JsonBody, PathParam},
    prelude::*,
};
use sanitize_filename::is_sanitized;
use serde::Deserialize;
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

#[handler]
async fn index(depot: &mut Depot, session: Session) -> Result<Json<Vec<File>>, Error> {
    let AppState { pool, .. } = depot.obtain::<AppState>().unwrap();
    let files = File::get_all_for_user(pool, session.user_id).await?;

    Ok(Json(files))
}

#[handler]
async fn show(
    depot: &mut Depot,
    session: Session,
    file_id: PathParam<Uid>,
) -> Result<Json<FileWithCollections>, Error> {
    let AppState { pool, .. } = depot.obtain::<AppState>().unwrap();
    let file = FileWithCollections::get_by_public_id(pool, session.user_id, &file_id)
        .await?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    Ok(Json(file))
}

#[derive(Deserialize, Extractible, Debug)]
#[salvo(extract(default_source(from = "query")))]
#[serde(rename_all = "camelCase")]
struct CreateFileSearchParams {
    collection_id: Option<Uid>,
}

// TODO: Upload quota per user
#[handler]
async fn create(
    depot: &mut Depot,
    session: Session,
    file: FormFile,
    query_params: CreateFileSearchParams,
) -> Result<Json<File>, Error> {
    let AppState { pool, dirs, .. } = depot.obtain::<AppState>().unwrap();
    let CreateFileSearchParams { collection_id } = &query_params;

    let Some(original_name) = file.name() else {
        return Err(Error::UnprocessableEntity("Expected file to have a name."));
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
    let file_size = file.size() as usize;
    let temp_path = file.path();

    let mut transaction = pool.begin().await?;

    let file = File::create(
        &mut *transaction,
        session.user_id,
        &file_id,
        &file_name,
        original_name,
        &file_size,
    )
    .await?;

    if let Some(collection_id) = collection_id {
        Collection::add_file(
            &mut *transaction,
            session.user_id,
            collection_id,
            &file.public_id,
        )
        .await?
        .ok_or_else(|| Error::NotFound("Collection not found or not owned by user."))?;
    }

    tokio::fs::copy(temp_path, &file_path)
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

#[handler]
async fn rename(
    depot: &mut Depot,
    session: Session,
    file_id: PathParam<Uid>,
    body: JsonBody<RenameFilePayload>,
) -> Result<Json<File>, Error> {
    let AppState { pool, .. } = depot.obtain::<AppState>().unwrap();
    let name = body.name.trim();

    if name.is_empty() {
        return Err(Error::UnprocessableEntity("File name must not be empty."));
    }

    if !is_sanitized(name) {
        return Err(Error::UnprocessableEntity(
            "File name contains invalid characters.",
        ));
    }

    let file = File::get_by_public_id(pool, session.user_id, &file_id)
        .await?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    let old_ext = std::path::Path::new(&file.filename).extension();
    let new_ext = std::path::Path::new(&name).extension();

    if old_ext != new_ext {
        return Err(Error::UnprocessableEntity(
            "New file extension much match the old one.",
        ));
    }

    let file = File::rename(pool, session.user_id, &file_id, name)
        .await?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    Ok(Json(file))
}

#[handler]
async fn remove(
    depot: &mut Depot,
    session: Session,
    file_id: PathParam<Uid>,
) -> Result<StatusCode, Error> {
    let AppState { pool, dirs, .. } = depot.obtain::<AppState>().unwrap();

    let file = File::delete(pool, session.user_id, &file_id)
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

#[handler]
async fn download(
    depot: &mut Depot,
    session: Session,
    file_id: PathParam<Uid>,
) -> Result<NamedFile, Error> {
    let AppState { pool, dirs, .. } = depot.obtain::<AppState>().unwrap();

    let file = File::get_by_public_id(pool, session.user_id, &file_id)
        .await?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    let file_path = dirs.uploads_dir().join(&file.filename);

    NamedFile::builder(file_path)
        .attached_name(file.name)
        .build()
        .await
        .map_err(|e| Error::Internal(e.into()))
}

#[handler]
async fn regenerate_thumbnail(
    depot: &mut Depot,
    res: &mut Response,
    session: Session,
    file_id: PathParam<Uid>,
) -> Result<StatusCode, Error> {
    let AppState { pool, dirs, .. } = depot.obtain::<AppState>().unwrap();

    let file = File::get_by_public_id(pool, session.user_id, &file_id)
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

    res.headers_mut().insert(
        header::LOCATION,
        HeaderValue::from_str(&format!("/thumbs/{}", thumb_file_name)).unwrap(),
    );

    Ok(StatusCode::CREATED)
}

pub fn routes(state: &AppState) -> Router {
    let AppState { settings, .. } = state;

    Router::new()
        .get(index)
        .push(Router::with_hoop(max_size(settings.max_file_size as u64)).post(create))
        .push(
            Router::with_path("{file_id}")
                .get(show)
                .patch(rename)
                .delete(remove)
                .push(Router::with_path("download").get(download))
                .push(Router::with_path("regenerate-thumbnail").post(regenerate_thumbnail)),
        )
}
