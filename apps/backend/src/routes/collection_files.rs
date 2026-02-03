use salvo::{
    oapi::extract::{JsonBody, PathParam},
    prelude::*,
};
use serde::Deserialize;

use crate::{
    error::{Error, ResultExt},
    models::{collection::Collection, file::File, session::Session},
    state::AppState,
    types::NanoId,
};

/// Get files
///
/// Get the files belonging to the current user
#[endpoint(tags("Collections"), status_codes(200))]
async fn index(
    depot: &mut Depot,
    session: Session,
    id: PathParam<NanoId>,
) -> Result<Json<Vec<File>>, Error> {
    let AppState { pool, .. } = depot.obtain::<AppState>().unwrap();
    if !Collection::exists(pool, session.user_id, &id).await? {
        return Err(Error::NotFound(
            "Collection not found or not owned by user.",
        ));
    }

    let files = Collection::get_files(pool, session.user_id, &id).await?;

    Ok(Json(files))
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct CollectionFilesPayload {
    pub id: NanoId,
}

/// Add file to collection
///
/// Add a file to a collection belonging to the current user
#[endpoint(tags("Collections"), status_codes(201))]
async fn add(
    depot: &mut Depot,
    session: Session,
    id: PathParam<NanoId>,
    body: JsonBody<CollectionFilesPayload>,
) -> Result<StatusCode, Error> {
    let AppState { pool, .. } = depot.obtain::<AppState>().unwrap();

    if !Collection::exists(pool, session.user_id, &id).await? {
        return Err(Error::NotFound(
            "Collection not found or not owned by user.",
        ));
    }

    Collection::add_file(pool, session.user_id, &id, &body.id)
        .await
        .map_constraint_err(
            "collection_files.collection_id, collection_files.file_id",
            |_| Error::Conflict("File already belongs to the collection."),
        )?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    Ok(StatusCode::CREATED)
}

/// Remove file from collection
///
/// Remove a file from a collection belonging to the current user
#[endpoint(tags("Collections"), status_codes(204))]
async fn remove(
    depot: &mut Depot,
    session: Session,
    id: PathParam<NanoId>,
    body: JsonBody<CollectionFilesPayload>,
) -> Result<StatusCode, Error> {
    let AppState { pool, .. } = depot.obtain::<AppState>().unwrap();

    if !Collection::exists(pool, session.user_id, &id).await? {
        return Err(Error::NotFound(
            "Collection not found or not owned by user.",
        ));
    }

    Collection::remove_file(pool, session.user_id, &id, &body.id)
        .await?
        .ok_or_else(|| Error::NotFound("File not found in collection."))?;

    Ok(StatusCode::NO_CONTENT)
}

pub fn routes() -> Router {
    Router::new().get(index).post(add).delete(remove)
}
