use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post},
};
use serde::Deserialize;

use crate::{
    api::{
        error::{Error, ResultExt},
        state::AppState,
    },
    db::collection,
    models::session::Session,
    types::Uid,
};

async fn index(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
    Path(collection_id): Path<Uid>,
) -> Result<impl IntoResponse, Error> {
    if !collection::exists(&pool, session.user_id, &collection_id).await? {
        return Err(Error::NotFound(
            "Collection not found or not owned by user.",
        ));
    }

    let files = collection::get_files(&pool, session.user_id, &collection_id).await?;

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
    if !collection::exists(&pool, session.user_id, &collection_id).await? {
        return Err(Error::NotFound(
            "Collection not found or not owned by user.",
        ));
    }

    collection::add_file(&pool, session.user_id, &collection_id, &body.id)
        .await
        .map_constraint_err(
            "collection_files.collection_id, collection_files.file_id",
            |_| Error::Conflict("File already belongs to the collection."),
        )?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    Ok(StatusCode::CREATED)
}

async fn remove(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
    Path(collection_id): Path<Uid>,
    Json(body): Json<CollectionFilesPayload>,
) -> Result<impl IntoResponse, Error> {
    if !collection::exists(&pool, session.user_id, &collection_id).await? {
        return Err(Error::NotFound(
            "Collection not found or not owned by user.",
        ));
    }

    collection::remove_file(&pool, session.user_id, &collection_id, &body.id)
        .await?
        .ok_or_else(|| Error::NotFound("File not found in collection."))?;

    Ok(StatusCode::NO_CONTENT)
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(index))
        .route("/", post(add))
        .route("/", delete(remove))
}
