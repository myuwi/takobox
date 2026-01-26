use salvo::{oapi::extract::{JsonBody, PathParam}, prelude::*};
use serde::Deserialize;

use super::collection_files;
use crate::{
    error::{Error, ResultExt},
    models::{collection::Collection, session::Session},
    state::AppState,
    types::Uid,
};

#[handler]
async fn index(depot: &mut Depot, session: Session) -> Result<Json<Vec<Collection>>, Error> {
    let AppState { pool, .. } = depot.obtain::<AppState>().unwrap();
    let collections = Collection::get_all_for_user(pool, session.user_id).await?;

    Ok(Json(collections))
}

#[derive(Debug, Deserialize)]
pub struct CreateCollectionPayload {
    pub name: String,
}

#[handler]
async fn create(
    depot: &mut Depot,
    session: Session,
    body: JsonBody<CreateCollectionPayload>,
) -> Result<Json<Collection>, Error> {
    let AppState { pool, .. } = depot.obtain::<AppState>().unwrap();
    let name = body.name.trim();

    if name.is_empty() {
        return Err(Error::UnprocessableEntity(
            "Collection name must not be empty.",
        ));
    }

    let collection = Collection::create(pool, session.user_id, name)
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

#[handler]
async fn rename(
    depot: &mut Depot,
    session: Session,
    collection_id: PathParam<Uid>,
    body: JsonBody<RenameCollectionPayload>,
) -> Result<Json<Collection>, Error> {
    let AppState { pool, .. } = depot.obtain::<AppState>().unwrap();

    let name = body.name.trim();

    if name.is_empty() {
        return Err(Error::UnprocessableEntity(
            "Collection name must not be empty",
        ));
    }

    let collection = Collection::rename(pool, session.user_id, &collection_id, name)
        .await
        .map_constraint_err("collections.user_id, collections.name", |_| {
            Error::Conflict("A collection with this name already exists. Please try another name.")
        })?
        .ok_or_else(|| Error::NotFound("Collection not found or not owned by user."))?;

    Ok(Json(collection))
}

#[handler]
async fn remove(
    depot: &mut Depot,
    session: Session,
    collection_id: PathParam<Uid>,
) -> Result<StatusCode, Error> {
    let AppState { pool, .. } = depot.obtain::<AppState>().unwrap();

    Collection::delete(pool, session.user_id, &collection_id)
        .await?
        .ok_or_else(|| Error::NotFound("Collection not found or not owned by user."))?;

    Ok(StatusCode::NO_CONTENT)
}

pub fn routes() -> Router {
    Router::new().get(index).post(create).push(
        Router::with_path("{collection_id}")
            .patch(rename)
            .delete(remove)
            .push(Router::with_path("files").push(collection_files::routes())),
    )
}
