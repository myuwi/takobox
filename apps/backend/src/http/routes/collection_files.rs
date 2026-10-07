use salvo::{oapi::extract::PathParam, prelude::*};

use crate::{
    http::{error::Error, response::FileResponse, state::AppState, status::NoContent},
    models::{collection::Collection, session::Session},
    types::NanoId,
};

/// Get files
///
/// Get the files belonging to the current user
#[endpoint(operation_id = "collections.files.list", tags("Collections"))]
async fn index(
    depot: &mut Depot,
    session: Session,
    id: PathParam<NanoId>,
) -> Result<Json<Vec<FileResponse>>, Error> {
    let AppState { pool, .. } = depot.get_typed::<AppState>().unwrap();
    if !Collection::exists(pool, session.user_id, &id).await? {
        return Err(Error::NotFound(
            "Collection not found or not owned by user.",
        ));
    }

    let files = Collection::get_files(pool, session.user_id, &id).await?;

    Ok(Json(files.into_iter().map(Into::into).collect()))
}

/// Add file to collection
///
/// Add a file to a collection belonging to the current user
#[endpoint(operation_id = "collections.files.add", tags("Collections"))]
async fn add(
    depot: &mut Depot,
    session: Session,
    id: PathParam<NanoId>,
    file_id: PathParam<NanoId>,
) -> Result<NoContent, Error> {
    let AppState { pool, .. } = depot.get_typed::<AppState>().unwrap();

    if !Collection::exists(pool, session.user_id, &id).await? {
        return Err(Error::NotFound(
            "Collection not found or not owned by user.",
        ));
    }

    Collection::add_file(pool, session.user_id, &id, &file_id)
        .await?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    Ok(NoContent)
}

/// Remove file from collection
///
/// Remove a file from a collection belonging to the current user
#[endpoint(operation_id = "collections.files.remove", tags("Collections"))]
async fn remove(
    depot: &mut Depot,
    session: Session,
    id: PathParam<NanoId>,
    file_id: PathParam<NanoId>,
) -> Result<NoContent, Error> {
    let AppState { pool, .. } = depot.get_typed::<AppState>().unwrap();

    if !Collection::exists(pool, session.user_id, &id).await? {
        return Err(Error::NotFound(
            "Collection not found or not owned by user.",
        ));
    }

    Collection::remove_file(pool, session.user_id, &id, &file_id)
        .await?
        .ok_or_else(|| Error::NotFound("File not found in collection."))?;

    Ok(NoContent)
}

pub fn routes() -> Router {
    Router::new()
        .get(index)
        .push(Router::with_path("{file_id}").put(add).delete(remove))
}
