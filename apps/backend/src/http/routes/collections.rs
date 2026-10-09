use salvo::{
    oapi::extract::{JsonBody, PathParam},
    prelude::*,
};
use serde::Deserialize;

use super::collection_files;
use crate::{
    db::{self, sessions::Session},
    domain::collection::{CollectionId, CollectionName},
    http::{
        error::{Error, ResultExt},
        response::CollectionResponse,
        state::AppState,
        status::{Created, NoContent},
    },
};

/// Get collections
///
/// Get the current user's collections
#[endpoint(operation_id = "collections.list", tags("Collections"))]
async fn index(
    depot: &mut Depot,
    session: Session,
) -> Result<Json<Vec<CollectionResponse>>, Error> {
    let AppState { pool, .. } = depot.get_typed::<AppState>().unwrap();
    let collections = db::collections::get_all_for_user(pool, session.user_id).await?;

    Ok(Json(collections.into_iter().map(Into::into).collect()))
}

/// Get collection
///
/// Get a collection belonging to the current user
#[endpoint(operation_id = "collections.get", tags("Collections"))]
async fn show(
    depot: &mut Depot,
    session: Session,
    id: PathParam<CollectionId>,
) -> Result<Json<CollectionResponse>, Error> {
    let AppState { pool, .. } = depot.get_typed::<AppState>().unwrap();
    let collection = db::collections::get_by_public_id(pool, session.user_id, &id)
        .await?
        .ok_or_else(|| Error::NotFound("Collection not found or not owned by user."))?;

    Ok(Json(collection.into()))
}

#[derive(Debug, Deserialize, ToSchema)]
#[salvo(schema(name = CreateCollectionPayload))]
pub struct CreateCollectionPayload {
    pub name: String,
}

/// Create collection
///
/// Create a collection
#[endpoint(
    operation_id = "collections.create",
    tags("Collections"),
    request_body = CreateCollectionPayload
)]
async fn create(
    depot: &mut Depot,
    session: Session,
    body: JsonBody<CreateCollectionPayload>,
) -> Result<Created<Json<CollectionResponse>>, Error> {
    let AppState { pool, .. } = depot.get_typed::<AppState>().unwrap();

    let name = CollectionName::try_from(body.name.clone()).map_err(Error::UnprocessableEntity)?;

    let collection = db::collections::create(pool, session.user_id, &name)
        .await
        .map_constraint_err("collections.user_id, collections.name", |_| {
            Error::Conflict("A collection with this name already exists. Please try another name.")
        })?;

    Ok(Created::new(
        format!("/api/collections/{}", collection.public_id),
        Json(collection.into()),
    ))
}

#[derive(Debug, Deserialize, ToSchema)]
#[salvo(schema(name = RenameCollectionPayload))]
pub struct RenameCollectionPayload {
    pub name: String,
}

/// Rename collection
///
/// Rename a collection belonging to the current user
#[endpoint(
    operation_id = "collections.rename",
    tags("Collections"),
    request_body = RenameCollectionPayload
)]
async fn rename(
    depot: &mut Depot,
    session: Session,
    id: PathParam<CollectionId>,
    body: JsonBody<RenameCollectionPayload>,
) -> Result<Json<CollectionResponse>, Error> {
    let AppState { pool, .. } = depot.get_typed::<AppState>().unwrap();

    let name = CollectionName::try_from(body.name.clone()).map_err(Error::UnprocessableEntity)?;

    let collection = db::collections::rename(pool, session.user_id, &id, &name)
        .await
        .map_constraint_err("collections.user_id, collections.name", |_| {
            Error::Conflict("A collection with this name already exists. Please try another name.")
        })?
        .ok_or_else(|| Error::NotFound("Collection not found or not owned by user."))?;

    Ok(Json(collection.into()))
}

/// Delete collection
///
/// Delete a collection belonging to the current user
#[endpoint(operation_id = "collections.delete", tags("Collections"))]
async fn delete(
    depot: &mut Depot,
    session: Session,
    id: PathParam<CollectionId>,
) -> Result<NoContent, Error> {
    let AppState { pool, .. } = depot.get_typed::<AppState>().unwrap();

    db::collections::delete(pool, session.user_id, &id)
        .await?
        .ok_or_else(|| Error::NotFound("Collection not found or not owned by user."))?;

    Ok(NoContent)
}

pub fn routes() -> Router {
    Router::new().get(index).post(create).push(
        Router::with_path("{id}")
            .get(show)
            .patch(rename)
            .delete(delete)
            .push(Router::with_path("files").push(collection_files::routes())),
    )
}
