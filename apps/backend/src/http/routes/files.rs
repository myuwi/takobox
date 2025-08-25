use axum::{
    Json, Router,
    extract::{DefaultBodyLimit, Multipart, Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post},
};
use axum_extra::response::FileStream;
use nanoid::nanoid;
use std::ffi::OsStr;
use tokio::io::AsyncWriteExt;
use tokio_util::io::ReaderStream;
use tracing::error;
use uuid::Uuid;

use crate::{
    THUMBS_PATH, UPLOADS_PATH,
    http::{
        auth::session::Session,
        error::Error,
        model::{file::File, settings::Settings},
        processing::thumbnail::{self, ThumbnailError},
        state::AppState,
    },
};

async fn index(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
) -> Result<impl IntoResponse, Error> {
    let files = sqlx::query_as!(
        File,
        "select * from files
        where user_id = $1
        order by created_at desc",
        session.user_id,
    )
    .fetch_all(&pool)
    .await
    .map_err(|_| Error::Internal)?;

    Ok(Json(files))
}

// TODO: Is this safe if some operation fails? Use transactions?
async fn create(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, Error> {
    while let Some(field) = multipart.next_field().await.map_err(|_| Error::Internal)? {
        let Some("file") = field.name() else { continue };

        let original_name = field
            .file_name()
            .map(|s| s.to_owned())
            .ok_or(Error::UnprocessableEntity("Missing file name"))?;

        // TODO: retry on db collision
        let file_id = nanoid!(12);
        let ext = std::path::Path::new(&original_name)
            .extension()
            .and_then(OsStr::to_str)
            .map(|p| ".".to_string() + p)
            .unwrap_or("".to_string());

        let file_name = file_id + &ext;
        let file_path = format!("{}/{}", UPLOADS_PATH, file_name);

        // TODO: Don't read everything into memory
        let data = field.bytes().await.map_err(|_| Error::Internal)?;
        let file_size = data.len() as i64;

        let mut file_handle = tokio::fs::File::create_new(&file_path)
            .await
            .map_err(|_| Error::Internal)?;

        file_handle
            .write_all(&data)
            .await
            .map_err(|_| Error::Internal)?;

        let file = sqlx::query_as!(
            File,
            "insert into files (user_id, name, original, size)
            values ($1, $2, $3, $4)
            returning * ",
            session.user_id,
            file_name,
            original_name,
            file_size,
        )
        .fetch_one(&pool)
        .await
        .map_err(|_| Error::Internal)?;

        match thumbnail::generate_thumbnail(&file_path).await {
            Ok(_) | Err(ThumbnailError::UnsupportedFiletype) => (),
            Err(ThumbnailError::ShellError(err)) => {
                error!("Error creating thumbnail for \"{}\": {}", file_path, err)
            }
        }

        return Ok(Json(file));
    }

    Err(Error::UnprocessableEntity("Expected a file."))
}

async fn delete_file(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, Error> {
    let file = sqlx::query_as!(
        File,
        "delete from files 
        where id = $1 and user_id = $2
        returning *",
        id,
        session.user_id,
    )
    .fetch_one(&pool)
    .await
    .map_err(|_| Error::NotFound("File doesn't exist or belongs to another user."))?;

    let file_id = file
        .name
        .rsplit_once('.')
        .map(|s| s.0)
        .ok_or(Error::Internal)?;

    let file_path = format!("{}/{}", UPLOADS_PATH, file.name);
    let thumb_path = format!("{}/{}.webp", THUMBS_PATH, file_id);

    let _ = tokio::fs::remove_file(&file_path)
        .await
        .inspect_err(|err| error!("Error deleting file \"{}\": {}", file_path, err));
    let _ = tokio::fs::remove_file(&thumb_path)
        .await
        .inspect_err(|err| error!("Error deleting file \"{}\": {}", thumb_path, err));

    Ok(StatusCode::NO_CONTENT)
}

async fn download(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, Error> {
    let file = sqlx::query_as!(
        File,
        "select * from files
        where id = $1 and user_id = $2",
        id,
        session.user_id,
    )
    .fetch_one(&pool)
    .await
    .map_err(|_| Error::NotFound("File doesn't exist or belongs to another user."))?;

    let file_path = format!("{}/{}", UPLOADS_PATH, file.name);
    let file_stream = FileStream::<ReaderStream<tokio::fs::File>>::from_path(file_path)
        .await
        .map_err(|_| Error::NotFound("File doesn't exist or belongs to another user."))?
        .file_name(file.original);

    Ok(file_stream)
}

async fn regenerate_thumbnail(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, Error> {
    let file = sqlx::query_as!(
        File,
        "select * from files
        where id = $1 and user_id = $2",
        id,
        session.user_id,
    )
    .fetch_one(&pool)
    .await
    .map_err(|_| Error::NotFound("File doesn't exist or belongs to another user."))?;

    let file_path = format!("{}/{}", UPLOADS_PATH, file.name);

    match thumbnail::generate_thumbnail(&file_path).await {
        Ok(file_name) => Ok((
            StatusCode::CREATED,
            [("Location", format!("/thumbs/{}", file_name))],
        )),
        Err(ThumbnailError::UnsupportedFiletype) => {
            Err(Error::BadRequest("Filetype doesn't support thumbnails."))
        }
        Err(ThumbnailError::ShellError(err)) => {
            error!("Error creating thumbnail for \"{}\": {}", file_path, err);
            Err(Error::Internal)
        }
    }
}

pub fn routes() -> Router<AppState> {
    let max_file_size = Settings::default().max_file_size;

    Router::new()
        .route("/", get(index))
        .route(
            "/",
            post(create).layer(DefaultBodyLimit::max(max_file_size)),
        )
        .route("/{id}", delete(delete_file))
        .route("/{id}/download", get(download))
        .route("/{id}/regenerate-thumbnail", post(regenerate_thumbnail))
}
