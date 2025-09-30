use serde::Serialize;
use sqlx::{FromRow, types::Json};
use time::PrimitiveDateTime;
use uuid::Uuid;

use super::collection::FileCollection;

#[derive(Clone, Debug, FromRow, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct File {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub original: String,
    pub size: i64,
    pub created_at: PrimitiveDateTime,
}

#[derive(Clone, Debug, FromRow, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileWithCollections {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub original: String,
    pub size: i64,
    pub created_at: PrimitiveDateTime,
    pub collections: Json<Vec<FileCollection>>,
}
