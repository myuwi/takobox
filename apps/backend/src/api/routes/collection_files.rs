use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post},
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    api::{error::Error, state::AppState},
    models::{file::File, session::Session},
};

async fn index(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
    Path(collection_id): Path<Uuid>,
) -> Result<impl IntoResponse, Error> {
    let files = sqlx::query_as!(
        File,
        "select f.* from collection_files cf
        join files f on cf.file_id = f.id
        join collections c on cf.collection_id = c.id
        where c.id = $1 and c.user_id = $2
        order by created_at desc",
        collection_id,
        session.user_id,
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(files))
}

#[derive(Debug, Deserialize)]
pub struct CollectionFilesPayload {
    pub id: Uuid,
}

async fn add(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
    Path(collection_id): Path<Uuid>,
    Json(body): Json<CollectionFilesPayload>,
) -> Result<impl IntoResponse, Error> {
    sqlx::query!(
        "insert into collection_files (collection_id, file_id)
        select $1, $2
        where exists (
            select 1
            from collections c
            where c.id = $1
              and c.user_id = $3
        )",
        collection_id,
        body.id,
        session.user_id,
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| {
        Error::NotFound("Collection or file doesn't exist or belongs to another user.")
    })?;

    Ok(StatusCode::CREATED)
}

async fn remove(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
    Path(collection_id): Path<Uuid>,
    Json(body): Json<CollectionFilesPayload>,
) -> Result<impl IntoResponse, Error> {
    sqlx::query!(
        "delete from collection_files
        where collection_id = $1
          and file_id = $2
          and exists (
            select 1
            from collections c
            where c.id = $1
              and c.user_id = $3
        )",
        collection_id,
        body.id,
        session.user_id,
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| {
        Error::NotFound("Collection or file doesn't exist or belongs to another user.")
    })?;

    Ok(StatusCode::NO_CONTENT)
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(index))
        .route("/", post(add))
        .route("/", delete(remove))
}
