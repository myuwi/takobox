use salvo::oapi::ToSchema;
use serde::Serialize;

use crate::{models::file::File, serialize::serialize_timestamp, types::NanoId};

#[derive(Clone, Debug, Serialize, ToSchema)]
#[salvo(schema(name = File))]
#[serde(rename_all = "camelCase")]
pub struct FileResponse {
    pub id: NanoId,
    pub name: String,
    pub filename: String,
    pub size: i64,
    #[salvo(schema(value_type = String))]
    #[serde(serialize_with = "serialize_timestamp")]
    pub created_at: i64,
}

impl From<File> for FileResponse {
    fn from(file: File) -> Self {
        Self {
            id: file.public_id,
            name: file.name,
            filename: file.filename,
            size: file.size,
            created_at: file.created_at,
        }
    }
}
