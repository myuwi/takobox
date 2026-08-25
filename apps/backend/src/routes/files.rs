use std::{ffi::OsStr, path::PathBuf};

use anyhow::anyhow;
use salvo::{
    fs::NamedFile,
    http::header::{self, HeaderValue},
    oapi::extract::{FormFile, JsonBody, PathParam, QueryParam},
    prelude::*,
};
use serde::Deserialize;
use tracing::error;

use crate::{
    error::Error,
    models::{
        collection::Collection,
        file::{File, FileName},
        session::Session,
    },
    services::thumbnails::{ThumbnailError, generate_thumbnail},
    state::AppState,
    types::NanoId,
};

/// Get files
///
/// Get the files belonging to the current user
#[endpoint(operation_id = "files.list", tags("Files"), status_codes(200))]
async fn index(depot: &mut Depot, session: Session) -> Result<Json<Vec<File>>, Error> {
    let AppState { pool, .. } = depot.get_typed::<AppState>().unwrap();
    let files = File::get_all_for_user(pool, session.user_id).await?;

    Ok(Json(files))
}

/// Get file
///
/// Get a file belonging to the current user
#[endpoint(operation_id = "files.get", tags("Files"), status_codes(200))]
async fn show(
    depot: &mut Depot,
    session: Session,
    id: PathParam<NanoId>,
) -> Result<Json<File>, Error> {
    let AppState { pool, .. } = depot.get_typed::<AppState>().unwrap();
    let file = File::get_by_public_id(pool, session.user_id, &id)
        .await?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    Ok(Json(file))
}

/// Get file collections
///
/// Get the collections containing a file belonging to the current user
#[endpoint(
    operation_id = "files.collections.list",
    tags("Files"),
    status_codes(200)
)]
async fn collections(
    depot: &mut Depot,
    session: Session,
    id: PathParam<NanoId>,
) -> Result<Json<Vec<Collection>>, Error> {
    let AppState { pool, .. } = depot.get_typed::<AppState>().unwrap();

    let file = File::get_by_public_id(pool, session.user_id, &id)
        .await?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    let file_collections = Collection::get_all_for_file(pool, session.user_id, file.id).await?;

    Ok(Json(file_collections))
}

#[derive(Deserialize, Extractible, Debug)]
#[salvo(extract(default_source(from = "query")))]
#[serde(rename_all = "camelCase")]
struct UploadFileSearchParams {
    collection_id: Option<NanoId>,
}

// TODO: Any way to automate this?
impl EndpointArgRegister for UploadFileSearchParams {
    fn register(
        components: &mut salvo::oapi::Components,
        operation: &mut salvo::oapi::Operation,
        _arg: &str,
    ) {
        <QueryParam<NanoId, false> as EndpointArgRegister>::register(
            components,
            operation,
            "collectionId",
        );
    }
}

// TODO: Fix oapi status code
// TODO: Upload quota per user
/// Upload file
///
/// Upload a file
#[endpoint(
    operation_id = "files.upload",
    tags("Files"),
    status_codes(201),
    responses(
        (status_code = 201, description = "Response with json format data", body = File)
    ),
)]
async fn upload(
    res: &mut Response,
    depot: &mut Depot,
    session: Session,
    // TODO: How to make this required?
    file: FormFile,
    query_params: UploadFileSearchParams,
) -> Result<Json<File>, Error> {
    let AppState { pool, dirs, .. } = depot.get_typed::<AppState>().unwrap();
    let UploadFileSearchParams { collection_id } = &query_params;

    let Some(original_name) = file.name() else {
        return Err(Error::UnprocessableEntity("Expected file to have a name."));
    };

    let name = FileName::try_from(original_name.to_owned()).map_err(Error::UnprocessableEntity)?;

    // TODO: retry on db collision
    let file_id = NanoId::new(6);
    let ext = std::path::Path::new(name.as_str())
        .extension()
        .and_then(OsStr::to_str)
        .map(|p| ".".to_string() + p)
        .unwrap_or("".to_string());

    let file_name = file_id.to_string() + &ext;
    let file_path = dirs.uploads_dir().join(&file_name);
    let file_size = file.size() as usize;
    let temp_path = file.path();

    let mut transaction = pool.begin().await?;

    let file = File::create(
        &mut *transaction,
        session.user_id,
        &file_id,
        &file_name,
        &name,
        &file_size,
    )
    .await?;

    if let Some(collection_id) = collection_id {
        Collection::add_file(
            &mut *transaction,
            session.user_id,
            collection_id,
            &file.public_id,
        )
        .await?
        .ok_or_else(|| Error::NotFound("Collection not found or not owned by user."))?;
    }

    tokio::fs::copy(temp_path, &file_path)
        .await
        .map_err(|e| Error::Internal(e.into()))?;

    match generate_thumbnail(&file_path, dirs.thumbs_dir()).await {
        Ok(_) | Err(ThumbnailError::UnsupportedFiletype) => (),
        Err(ThumbnailError::ShellError(err)) => {
            error!("Error creating thumbnail for \"{:?}\": {}", file_path, err)
        }
    }

    transaction.commit().await?;

    res.status_code(StatusCode::CREATED);

    Ok(Json(file))
}

#[derive(Debug, Deserialize, ToSchema)]
#[salvo(schema(name = RenameFilePayload))]
pub struct RenameFilePayload {
    pub name: String,
}

/// Rename file
///
/// Rename a file belonging to the current user
#[endpoint(operation_id = "files.rename", tags("Files"), status_codes(200))]
async fn rename(
    depot: &mut Depot,
    session: Session,
    id: PathParam<NanoId>,
    body: JsonBody<RenameFilePayload>,
) -> Result<Json<File>, Error> {
    let AppState { pool, .. } = depot.get_typed::<AppState>().unwrap();

    let name = FileName::try_from(body.name.clone()).map_err(Error::UnprocessableEntity)?;

    let file = File::get_by_public_id(pool, session.user_id, &id)
        .await?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    let new_name = file
        .parse_rename(name)
        .map_err(Error::UnprocessableEntity)?;

    let file = File::rename(pool, session.user_id, &id, new_name)
        .await?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    Ok(Json(file))
}

/// Delete file
///
/// Delete a file belonging to the current user
#[endpoint(operation_id = "files.delete", tags("Files"), status_codes(204))]
async fn delete(
    depot: &mut Depot,
    session: Session,
    id: PathParam<NanoId>,
) -> Result<StatusCode, Error> {
    let AppState { pool, dirs, .. } = depot.get_typed::<AppState>().unwrap();

    let file = File::delete(pool, session.user_id, &id)
        .await?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    let thumb_name = PathBuf::from(&file.filename).with_extension("avif");

    let file_path = dirs.uploads_dir().join(&file.filename);
    let thumb_path = dirs.thumbs_dir().join(thumb_name);

    let _ = tokio::fs::remove_file(&file_path)
        .await
        .inspect_err(|err| error!("Error deleting file \"{:?}\": {}", file_path, err));
    let _ = tokio::fs::remove_file(&thumb_path)
        .await
        .inspect_err(|err| error!("Error deleting file \"{:?}\": {}", thumb_path, err));

    Ok(StatusCode::NO_CONTENT)
}

/// Download file
///
/// Download a file belonging to the current user
#[endpoint(operation_id = "files.download", tags("Files"), status_codes(200))]
async fn download(
    req: &Request,
    res: &mut Response,
    depot: &mut Depot,
    session: Session,
    id: PathParam<NanoId>,
) -> Result<StatusCode, Error> {
    let AppState { pool, dirs, .. } = depot.get_typed::<AppState>().unwrap();

    let file = File::get_by_public_id(pool, session.user_id, &id)
        .await?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    let file_path = dirs.uploads_dir().join(&file.filename);

    let file = NamedFile::builder(file_path)
        .attached_name(file.name)
        .build()
        .await
        .map_err(|e| Error::Internal(e.into()))?;

    file.send(req.headers(), res).await;

    Ok(StatusCode::OK)
}

/// Regenerate thumbnail
///
/// Regenerate the thumbnail for a file belonging to the current user
#[endpoint(
    operation_id = "files.regenerateThumbnail",
    tags("Files"),
    status_codes(201)
)]
async fn regenerate_thumbnail(
    depot: &mut Depot,
    res: &mut Response,
    session: Session,
    id: PathParam<NanoId>,
) -> Result<StatusCode, Error> {
    let AppState { pool, dirs, .. } = depot.get_typed::<AppState>().unwrap();

    let file = File::get_by_public_id(pool, session.user_id, &id)
        .await?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    let file_path = dirs.uploads_dir().join(file.filename);

    let thumb_file_name = generate_thumbnail(&file_path, dirs.thumbs_dir())
        .await
        .map_err(|err| match err {
            ThumbnailError::UnsupportedFiletype => {
                Error::BadRequest("Filetype doesn't support thumbnails.")
            }
            ThumbnailError::ShellError(err) => Error::Internal(anyhow!(
                "Error creating thumbnail for \"{:?}\": {}",
                file_path,
                err
            )),
        })?;

    res.headers_mut().insert(
        header::LOCATION,
        HeaderValue::from_str(&format!("/thumbs/{}", thumb_file_name)).unwrap(),
    );

    Ok(StatusCode::CREATED)
}

pub fn routes(state: &AppState) -> Router {
    let AppState { settings, .. } = state;

    Router::new()
        .get(index)
        .push(Router::with_hoop(max_size(settings.max_file_size as u64)).post(upload))
        .push(
            Router::with_path("{id}")
                .get(show)
                .patch(rename)
                .delete(delete)
                .push(Router::with_path("collections").get(collections))
                .push(Router::with_path("download").get(download))
                .push(Router::with_path("regenerate-thumbnail").post(regenerate_thumbnail)),
        )
}
