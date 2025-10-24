use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, patch, post},
};
use serde::Deserialize;

use super::collection_files;
use crate::{
    api::{
        error::{Error, ResultExt},
        state::AppState,
    },
    models::{collection::Collection, session::Session},
    types::Uid,
};

async fn index(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
) -> Result<impl IntoResponse, Error> {
    let collections = Collection::get_all_for_user(&pool, session.user_id).await?;

    Ok(Json(collections))
}

#[derive(Debug, Deserialize)]
pub struct CreateCollectionPayload {
    pub name: String,
}

async fn create(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
    Json(body): Json<CreateCollectionPayload>,
) -> Result<impl IntoResponse, Error> {
    let name = body.name.trim();

    if name.is_empty() {
        return Err(Error::UnprocessableEntity(
            "Collection name must not be empty",
        ));
    }

    let collection = Collection::create(&pool, session.user_id, name)
        .await
        .map_constraint_err("collections.user_id, collections.name", |_| {
            Error::Conflict("A collection with this name already exists. Please try another name.")
        })?;

    Ok(Json(collection))
}

#[derive(Debug, Deserialize)]
pub struct RenameCollectionPayload {
    pub name: String,
}

async fn rename(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
    Path(collection_id): Path<Uid>,
    Json(body): Json<RenameCollectionPayload>,
) -> Result<impl IntoResponse, Error> {
    let name = body.name.trim();

    if name.is_empty() {
        return Err(Error::UnprocessableEntity(
            "Collection name must not be empty",
        ));
    }

    let collection = Collection::rename(&pool, session.user_id, &collection_id, name)
        .await
        .map_constraint_err("collections.user_id, collections.name", |_| {
            Error::Conflict("A collection with this name already exists. Please try another name.")
        })?
        .ok_or_else(|| Error::NotFound("Collection not found or not owned by user."))?;

    Ok(Json(collection))
}

async fn remove(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
    Path(collection_id): Path<Uid>,
) -> Result<impl IntoResponse, Error> {
    Collection::delete(&pool, session.user_id, &collection_id)
        .await?
        .ok_or_else(|| Error::NotFound("Collection not found or not owned by user."))?;

    Ok(StatusCode::NO_CONTENT)
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(index))
        .route("/", post(create))
        .route("/{id}", patch(rename))
        .route("/{id}", delete(remove))
        .nest("/{id}/files", collection_files::routes())
}
