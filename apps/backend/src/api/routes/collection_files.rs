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
    types::Uid,
};

async fn index(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
    Path(collection_id): Path<Uid>,
) -> Result<impl IntoResponse, Error> {
    let files = collection::get_files(&pool, session.user_id, &collection_id)
        .await?
        .ok_or_else(|| Error::NotFound("Collection doesn't exist or belongs to another user."))?;

    Ok(Json(files))
}

#[derive(Debug, Deserialize)]
pub struct CollectionFilesPayload {
    pub id: Uid,
}

async fn add(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
    Path(collection_id): Path<Uid>,
    Json(body): Json<CollectionFilesPayload>,
) -> Result<impl IntoResponse, Error> {
    collection::add_file(&pool, session.user_id, &collection_id, &body.id)
        .await?
        .ok_or_else(|| {
            Error::NotFound("Collection or file doesn't exist or belongs to another user.")
        })?;

    Ok(StatusCode::CREATED)
}

async fn remove(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
    Path(collection_id): Path<Uid>,
    Json(body): Json<CollectionFilesPayload>,
) -> Result<impl IntoResponse, Error> {
    collection::remove_file(&pool, session.user_id, &collection_id, &body.id)
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
