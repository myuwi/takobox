use std::{
    ffi::OsStr,
    path::{Path, PathBuf},
};

use salvo::{
    fs::NamedFile,
    oapi::extract::{FormFile, JsonBody, PathParam},
    prelude::*,
};
use serde::Deserialize;
use tempfile::NamedTempFile;
use tracing::{error, warn};

use crate::{
    db::{self, sessions::Session},
    domain::{
        collection::CollectionId,
        file::{FileId, FileName, FileRename},
    },
    http::{
        error::Error,
        middleware::size_limit::limit_upload_size,
        response::{CollectionResponse, FileResponse},
        state::AppState,
        status::{Created, NoContent},
    },
    services::thumbnails::{ThumbnailError, generate_thumbnail},
};

/// Get files
///
/// Get the files belonging to the current user
#[endpoint(operation_id = "files.list", tags("Files"))]
async fn index(depot: &mut Depot, session: Session) -> Result<Json<Vec<FileResponse>>, Error> {
    let AppState { pool, .. } = depot.get_typed::<AppState>().unwrap();
    let files = db::files::get_all_for_user(pool, session.user_id).await?;

    Ok(Json(files.into_iter().map(Into::into).collect()))
}

/// Get file
///
/// Get a file belonging to the current user
#[endpoint(operation_id = "files.get", tags("Files"))]
async fn show(
    depot: &mut Depot,
    session: Session,
    id: PathParam<FileId>,
) -> Result<Json<FileResponse>, Error> {
    let AppState { pool, .. } = depot.get_typed::<AppState>().unwrap();
    let file = db::files::get_by_public_id(pool, session.user_id, &id)
        .await?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    Ok(Json(file.into()))
}

/// Get file collections
///
/// Get the collections containing a file belonging to the current user
#[endpoint(operation_id = "files.collections.list", tags("Files"))]
async fn collections(
    depot: &mut Depot,
    session: Session,
    id: PathParam<FileId>,
) -> Result<Json<Vec<CollectionResponse>>, Error> {
    let AppState { pool, .. } = depot.get_typed::<AppState>().unwrap();

    let file = db::files::get_by_public_id(pool, session.user_id, &id)
        .await?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    let file_collections =
        db::collection_files::get_collections(pool, session.user_id, file.id).await?;

    Ok(Json(file_collections.into_iter().map(Into::into).collect()))
}

#[derive(Deserialize, ToParameters, Debug)]
#[salvo(parameters(default_parameter_in = Query, rename_all = "camelCase"))]
#[serde(rename_all = "camelCase")]
struct UploadFileSearchParams {
    collection_id: Option<CollectionId>,
}

// Only describes the multipart body for the OpenAPI schema; `FormFile` parses it.
#[derive(ToSchema)]
#[salvo(schema(name = UploadFilePayload))]
struct UploadFilePayload {
    #[expect(dead_code)]
    #[salvo(schema(value_type = String, format = Binary))]
    file: String,
}

// TODO: Upload quota per user
/// Upload file
///
/// Upload a file
#[endpoint(
    operation_id = "files.upload",
    tags("Files"),
    request_body(content = UploadFilePayload, content_type = "multipart/form-data")
)]
async fn upload(
    depot: &mut Depot,
    session: Session,
    file: FormFile,
    query_params: UploadFileSearchParams,
) -> Result<Created<Json<FileResponse>>, Error> {
    let AppState { pool, dirs, .. } = depot.get_typed::<AppState>().unwrap();
    let UploadFileSearchParams { collection_id } = &query_params;

    let Some(original_name) = file.name() else {
        return Err(Error::UnprocessableEntity("Expected file to have a name."));
    };

    let name = FileName::try_from(original_name.to_owned()).map_err(Error::UnprocessableEntity)?;

    let ext = std::path::Path::new(name.as_str())
        .extension()
        .and_then(OsStr::to_str)
        .map(|p| ".".to_string() + p)
        .unwrap_or("".to_string());

    let file_size = file.size() as i64;
    let temp_path = file.path();

    // salvo's temp file may be on another filesystem, so copy it here to move it in atomically.
    // Note: tempfile's calls are blocking.
    let staged = NamedTempFile::new_in(dirs.tmp_dir())
        .map_err(|e| Error::internal("failed to stage upload", e))?
        .into_temp_path();
    tokio::fs::copy(temp_path, &staged)
        .await
        .map_err(|e| Error::internal("failed to stage upload", e))?;

    let mut transaction = pool.begin().await?;

    let mut attempt = 1;
    let file = loop {
        let file_id = FileId::generate(6);
        let file_name = file_id.to_string() + &ext;

        match db::files::create(
            &mut *transaction,
            session.user_id,
            &file_id,
            &file_name,
            &name,
            file_size,
        )
        .await
        {
            Err(err)
                if attempt < db::MAX_ID_ATTEMPTS
                    && db::is_unique_violation(&err, &["files.public_id", "files.filename"]) =>
            {
                attempt += 1;
            }
            result => break result?,
        }
    };

    let file_path = dirs.uploads_dir().join(&file.filename);

    if let Some(collection_id) = collection_id {
        db::collection_files::add(
            &mut *transaction,
            session.user_id,
            collection_id,
            &file.public_id,
        )
        .await?
        .ok_or_else(|| Error::NotFound("Collection not found or not owned by user."))?;
    }

    staged
        .persist(&file_path)
        .map_err(|e| Error::internal("failed to store upload", e.error))?;

    if let Err(err) = transaction.commit().await {
        remove_failed_upload(&file_path).await;
        return Err(err.into());
    }

    match generate_thumbnail(&file_path, dirs.thumbs_dir()).await {
        Ok(()) | Err(ThumbnailError::UnsupportedFiletype) => (),
        Err(ThumbnailError::ShellError(err)) => {
            error!(path = %file_path.display(), error = %err, "failed to run ffmpeg");
        }
        Err(ThumbnailError::CommandFailed { status, stderr }) => {
            warn!(path = %file_path.display(), %status, %stderr, "failed to create thumbnail");
        }
        Err(ThumbnailError::TimedOut) => {
            warn!(path = %file_path.display(), "timed out creating thumbnail");
        }
    }

    Ok(Created::new(
        format!("/api/files/{}", file.public_id),
        Json(file.into()),
    ))
}

async fn remove_failed_upload(path: &Path) {
    if let Err(err) = tokio::fs::remove_file(path).await
        && err.kind() != std::io::ErrorKind::NotFound
    {
        warn!(path = %path.display(), error = %err, "failed to remove a failed upload");
    }
}

#[derive(Debug, Deserialize, ToSchema)]
#[salvo(schema(name = RenameFilePayload))]
pub struct RenameFilePayload {
    pub name: String,
}

/// Rename file
///
/// Rename a file belonging to the current user
#[endpoint(
    operation_id = "files.rename",
    tags("Files"),
    request_body = RenameFilePayload
)]
async fn rename(
    depot: &mut Depot,
    session: Session,
    id: PathParam<FileId>,
    body: JsonBody<RenameFilePayload>,
) -> Result<Json<FileResponse>, Error> {
    let AppState { pool, .. } = depot.get_typed::<AppState>().unwrap();

    let name = FileName::try_from(body.name.clone()).map_err(Error::UnprocessableEntity)?;

    let file = db::files::get_by_public_id(pool, session.user_id, &id)
        .await?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    let file_rename = FileRename::new(&file.filename, name).map_err(Error::UnprocessableEntity)?;

    let file = db::files::rename(pool, session.user_id, &id, file_rename)
        .await?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    Ok(Json(file.into()))
}

/// Delete file
///
/// Delete a file belonging to the current user
#[endpoint(operation_id = "files.delete", tags("Files"))]
async fn delete(
    depot: &mut Depot,
    session: Session,
    id: PathParam<FileId>,
) -> Result<NoContent, Error> {
    let AppState { pool, dirs, .. } = depot.get_typed::<AppState>().unwrap();

    let mut transaction = pool.begin().await?;

    let file = db::files::delete(&mut *transaction, session.user_id, &id)
        .await?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    let thumb_name = PathBuf::from(&file.filename).with_extension("avif");

    let file_path = dirs.uploads_dir().join(&file.filename);
    let thumb_path = dirs.thumbs_dir().join(thumb_name);

    // Removing a file can't be rolled back, so remove the thumbnail first, as it can be
    // regenerated if removing the file fails.
    if let Err(err) = tokio::fs::remove_file(&thumb_path).await
        && err.kind() != std::io::ErrorKind::NotFound
    {
        return Err(Error::internal("failed to delete thumbnail", err));
    }
    match tokio::fs::remove_file(&file_path).await {
        Ok(()) => (),
        // An invalid state, but the file is gone either way, so finish deleting it.
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => {
            error!(path = %file_path.display(), "tried to delete a missing file");
        }
        Err(err) => {
            return Err(Error::internal("failed to delete file", err));
        }
    }

    transaction.commit().await?;

    Ok(NoContent)
}

/// Download file
///
/// Download a file belonging to the current user
#[endpoint(operation_id = "files.download", tags("Files"))]
async fn download(
    req: &Request,
    res: &mut Response,
    depot: &mut Depot,
    session: Session,
    id: PathParam<FileId>,
) -> Result<(), Error> {
    let AppState { pool, dirs, .. } = depot.get_typed::<AppState>().unwrap();

    let file = db::files::get_by_public_id(pool, session.user_id, &id)
        .await?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    let file_path = dirs.uploads_dir().join(&file.filename);

    let file = NamedFile::builder(file_path)
        .attached_name(file.name)
        .build()
        .await
        .map_err(|e| Error::internal("failed to open file", e))?;

    file.send(req.headers(), res).await;

    Ok(())
}

/// Regenerate thumbnail
///
/// Regenerate the thumbnail for a file belonging to the current user
#[endpoint(operation_id = "files.regenerateThumbnail", tags("Files"))]
async fn regenerate_thumbnail(
    depot: &mut Depot,
    session: Session,
    id: PathParam<FileId>,
) -> Result<Json<FileResponse>, Error> {
    let AppState { pool, dirs, .. } = depot.get_typed::<AppState>().unwrap();

    let file = db::files::get_by_public_id(pool, session.user_id, &id)
        .await?
        .ok_or_else(|| Error::NotFound("File not found or not owned by user."))?;

    let file_path = dirs.uploads_dir().join(&file.filename);

    match generate_thumbnail(&file_path, dirs.thumbs_dir()).await {
        Ok(()) => (),
        Err(ThumbnailError::UnsupportedFiletype) => {
            return Err(Error::BadRequest("Filetype doesn't support thumbnails."));
        }
        Err(ThumbnailError::ShellError(err)) => {
            return Err(Error::internal("failed to run ffmpeg", err));
        }
        Err(ThumbnailError::CommandFailed { status, stderr }) => {
            warn!(path = %file_path.display(), %status, %stderr, "failed to create thumbnail");
            return Err(Error::UnprocessableEntity(
                "Couldn't create a thumbnail for this file.",
            ));
        }
        Err(ThumbnailError::TimedOut) => {
            warn!(path = %file_path.display(), "timed out creating thumbnail");
            return Err(Error::UnprocessableEntity(
                "Couldn't create a thumbnail for this file.",
            ));
        }
    }

    Ok(Json(file.into()))
}

pub fn routes() -> Router {
    Router::new()
        .get(index)
        .push(Router::with_hoop(limit_upload_size).post(upload))
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
