use std::ffi::OsStr;

use anyhow::anyhow;
use axum::{
    Json, Router,
    body::Bytes,
    extract::{DefaultBodyLimit, Multipart, Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post},
};
use axum_extra::response::FileStream;
use nanoid::nanoid;
use tokio::io::AsyncWriteExt;
use tokio_util::io::ReaderStream;
use tracing::error;
use uuid::Uuid;

use crate::{
    api::{error::Error, state::AppState},
    models::{
        collection::FileCollection,
        file::{File, FileWithCollections},
        session::Session,
    },
    services::thumbnails::{ThumbnailError, generate_thumbnail},
};

async fn index(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
) -> Result<impl IntoResponse, Error> {
    // TODO: Move db queries out of route handlers
    let files = sqlx::query_as!(
        File,
        "select * from files
        where user_id = $1
        order by created_at desc",
        session.user_id,
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(files))
}

async fn show(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
    Path(file_id): Path<Uuid>,
) -> Result<impl IntoResponse, Error> {
    let file = sqlx::query_as!(
        FileWithCollections,
        r#"select 
            f.id, f.user_id, f.name, f.original, f.size, f.created_at,
            coalesce(
                json_agg(
                    json_build_object('id', c.id, 'name', c.name)
                ) filter (where c.id is not null),
                '[]'
            ) as "collections!: sqlx::types::Json<Vec<FileCollection>>"
        from files f
        left join collection_files cf on f.id = cf.file_id
        left join collections c on cf.collection_id = c.id
        where f.id = $1 and f.user_id = $2
        group by f.id, f.user_id, f.name, f.original, f.size, f.created_at"#,
        file_id,
        session.user_id,
    )
    .fetch_one(&pool)
    .await?;

    Ok(Json(file))
}

// TODO: Upload quota per user
async fn create(
    State(AppState { pool, dirs, .. }): State<AppState>,
    session: Session,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, Error> {
    let mut collection_id: Option<Uuid> = None;
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
                        .bytes()
                        .await
                        .map_err(|_| Error::BadRequest("Bad request"))
                        .and_then(|bytes| {
                            Uuid::try_parse_ascii(&bytes)
                                .map_err(|_| Error::BadRequest("Bad request"))
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
    let file_id = nanoid!(12);
    let ext = std::path::Path::new(&original_name)
        .extension()
        .and_then(OsStr::to_str)
        .map(|p| ".".to_string() + p)
        .unwrap_or("".to_string());

    let file_name = file_id + &ext;
    let file_path = dirs.uploads_dir().join(&file_name);
    let file_size = file_bytes.len() as i64;

    let mut transaction = pool.begin().await?;

    let file = sqlx::query_as!(
        File,
        "insert into files (user_id, name, original, size)
        values ($1, $2, $3, $4)
        returning *",
        session.user_id,
        file_name,
        original_name,
        file_size,
    )
    .fetch_one(&mut *transaction)
    .await?;

    if let Some(collection_id) = collection_id {
        let res = sqlx::query!(
            "insert into collection_files (collection_id, file_id)
            select $1, $2
            where exists (
                select 1
                from collections c
                where c.id = $1
                  and c.user_id = $3
            )",
            collection_id,
            file.id,
            session.user_id,
        )
        .execute(&mut *transaction)
        .await?;

        if res.rows_affected() == 0 {
            return Err(Error::NotFound(
                "Collection or file doesn't exist or belongs to another user.",
            ));
        }
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

async fn delete_file(
    State(AppState { pool, dirs, .. }): State<AppState>,
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
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| Error::NotFound("File doesn't exist or belongs to another user."))?;

    let file_id = file
        .name
        .rsplit_once('.')
        .map(|s| s.0)
        .unwrap_or(&file.name);

    let file_path = dirs.uploads_dir().join(&file.name);
    let thumb_path = dirs.thumbs_dir().join(file_id);

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
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, Error> {
    let file = sqlx::query_as!(
        File,
        "select * from files
        where id = $1 and user_id = $2",
        id,
        session.user_id,
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| Error::NotFound("File doesn't exist or belongs to another user."))?;

    let file_path = dirs.uploads_dir().join(&file.name);
    let file_stream = FileStream::<ReaderStream<tokio::fs::File>>::from_path(file_path)
        .await
        .map_err(|_| Error::NotFound("File doesn't exist or belongs to another user."))?
        .file_name(file.original);

    Ok(file_stream)
}

async fn regenerate_thumbnail(
    State(AppState { pool, dirs, .. }): State<AppState>,
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
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| Error::NotFound("File doesn't exist or belongs to another user."))?;

    let file_path = dirs.uploads_dir().join(file.name);

    let file_name = generate_thumbnail(&file_path, dirs.thumbs_dir())
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
        [("Location", format!("/thumbs/{}", file_name))],
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
        .route("/{id}", delete(delete_file))
        .route("/{id}/download", get(download))
        .route("/{id}/regenerate-thumbnail", post(regenerate_thumbnail))
}
