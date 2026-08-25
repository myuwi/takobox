use salvo::{
    oapi::extract::{JsonBody, PathParam},
    prelude::*,
};
use serde::Deserialize;

use super::collection_files;
use crate::{
    error::{Error, ResultExt},
    models::{
        collection::{Collection, CollectionName},
        session::Session,
    },
    response::CollectionResponse,
    state::AppState,
    types::NanoId,
};

/// Get collections
///
/// Get the current user's collections
#[endpoint(
    operation_id = "collections.list",
    tags("Collections"),
    status_codes(200)
)]
async fn index(
    depot: &mut Depot,
    session: Session,
) -> Result<Json<Vec<CollectionResponse>>, Error> {
    let AppState { pool, .. } = depot.get_typed::<AppState>().unwrap();
    let collections = Collection::get_all_for_user(pool, session.user_id).await?;

    Ok(Json(collections.into_iter().map(Into::into).collect()))
}

#[derive(Debug, Deserialize, ToSchema)]
#[salvo(schema(name = CreateCollectionPayload))]
pub struct CreateCollectionPayload {
    pub name: String,
}

// TODO: Correct response struct
/// Create collection
///
/// Create a collection
#[endpoint(
    operation_id = "collections.create",
    tags("Collections"),
    status_codes(201),
    responses(
        (status_code = 201, description = "Response with json format data", body = CollectionResponse)
    ),
)]
async fn create(
    res: &mut Response,
    depot: &mut Depot,
    session: Session,
    body: JsonBody<CreateCollectionPayload>,
) -> Result<Json<CollectionResponse>, Error> {
    let AppState { pool, .. } = depot.get_typed::<AppState>().unwrap();

    let name = CollectionName::try_from(body.name.clone()).map_err(Error::UnprocessableEntity)?;

    let collection = Collection::create(pool, session.user_id, &name)
        .await
        .map_constraint_err("collections.user_id, collections.name", |_| {
            Error::Conflict("A collection with this name already exists. Please try another name.")
        })?;

    res.status_code(StatusCode::CREATED);

    Ok(Json(collection.into()))
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
    status_codes(200)
)]
async fn rename(
    depot: &mut Depot,
    session: Session,
    id: PathParam<NanoId>,
    body: JsonBody<RenameCollectionPayload>,
) -> Result<Json<CollectionResponse>, Error> {
    let AppState { pool, .. } = depot.get_typed::<AppState>().unwrap();

    let name = CollectionName::try_from(body.name.clone()).map_err(Error::UnprocessableEntity)?;

    let collection = Collection::rename(pool, session.user_id, &id, &name)
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
#[endpoint(
    operation_id = "collections.delete",
    tags("Collections"),
    status_codes(204)
)]
async fn delete(
    depot: &mut Depot,
    session: Session,
    id: PathParam<NanoId>,
) -> Result<StatusCode, Error> {
    let AppState { pool, .. } = depot.get_typed::<AppState>().unwrap();

    Collection::delete(pool, session.user_id, &id)
        .await?
        .ok_or_else(|| Error::NotFound("Collection not found or not owned by user."))?;

    Ok(StatusCode::NO_CONTENT)
}

pub fn routes() -> Router {
    Router::new().get(index).post(create).push(
        Router::with_path("{id}")
            .patch(rename)
            .delete(delete)
            .push(Router::with_path("files").push(collection_files::routes())),
    )
}
