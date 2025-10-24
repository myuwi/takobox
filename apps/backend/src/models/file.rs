use serde::Serialize;
use sqlx::FromRow;

use super::collection::FileCollection;
use crate::{serialize::serialize_timestamp, types::Uid};

#[derive(Clone, Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct File {
    #[serde(skip_serializing)]
    pub id: i64,
    #[serde(rename(serialize = "id"))]
    pub public_id: Uid,
    #[serde(skip_serializing)]
    pub user_id: i64,
    pub name: String,
    pub original: String,
    pub size: i64,
    #[serde(serialize_with = "serialize_timestamp")]
    pub created_at: i64,
}

#[derive(Clone, Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct FileWithCollections {
    #[serde(flatten)]
    #[sqlx(flatten)]
    pub file: File,
    #[sqlx(json)]
    pub collections: Vec<FileCollection>,
}
