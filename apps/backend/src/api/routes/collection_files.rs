use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post},
};
use serde::Deserialize;

use crate::{
    api::{error::Error, state::AppState},
    db::collection,
    models::session::Session,
    types::Uuid,
};

async fn index(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
    Path(collection_id): Path<Uuid>,
) -> Result<impl IntoResponse, Error> {
    let files = collection::get_files(&pool, &collection_id, &session.user_id).await?;

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
    collection::add_file(&pool, &collection_id, &body.id, &session.user_id)
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
    collection::remove_file(&pool, &collection_id, &body.id, &session.user_id)
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
