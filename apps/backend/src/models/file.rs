use serde::Serialize;
use sqlx::FromRow;

use super::collection::FileCollection;
use crate::types::Uuid;

#[derive(Clone, Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct File {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub original: String,
    pub size: i64,
    pub created_at: i64,
}

#[derive(Clone, Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct FileWithCollections {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub original: String,
    pub size: i64,
    pub created_at: i64,
    #[sqlx(json)]
    pub collections: Vec<FileCollection>,
}
