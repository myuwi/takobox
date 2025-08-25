use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post},
};
use serde::Deserialize;
use uuid::Uuid;

use crate::http::{
    auth::session::Session, error::Error, model::collection::Collection, state::AppState,
};

async fn index(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
) -> Result<impl IntoResponse, Error> {
    let collections = sqlx::query_as!(
        Collection,
        "select * from collections
        where user_id = $1
        order by name asc",
        session.user_id,
    )
    .fetch_all(&pool)
    .await
    .map_err(|_| Error::Internal)?;

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

    let collection = sqlx::query_as!(
        Collection,
        "insert into collections (user_id, name)
        values ($1, $2)
        returning *",
        session.user_id,
        name,
    )
    .fetch_one(&pool)
    .await
    .map_err(
        |err| match err.as_database_error().and_then(|e| e.constraint()) {
            Some("collections_user_id_name_key") => Error::UnprocessableEntity(
                "A collection with this name already exists. Please try another name.",
            ),
            _ => Error::Internal,
        },
    )?;

    Ok(Json(collection))
}

async fn delete_collection(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, Error> {
    sqlx::query!(
        "delete from collections
        where id = $1 and user_id = $2",
        id,
        session.user_id,
    )
    .execute(&pool)
    .await
    .map_err(|_| Error::NotFound("Collection doesn't exist or belongs to another user."))?;

    Ok(StatusCode::NO_CONTENT)
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(index))
        .route("/", post(create))
        .route("/{id}", delete(delete_collection))
}
