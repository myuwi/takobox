use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use crate::{serialize::serialize_timestamp, types::Uuid};

#[derive(Clone, Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Collection {
    #[serde(skip_serializing)]
    pub id: i64,
    #[serde(rename(serialize = "id"))]
    pub public_id: Uuid,
    #[serde(skip_serializing)]
    pub user_id: i64,
    pub name: String,
    #[serde(serialize_with = "serialize_timestamp")]
    pub created_at: i64,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct FileCollection {
    #[serde(skip_serializing)]
    pub id: i64,
    #[serde(rename(serialize = "id"))]
    pub public_id: Uuid,
    pub name: String,
}
