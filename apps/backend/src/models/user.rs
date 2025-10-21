use serde::Serialize;
use sqlx::FromRow;

use crate::{serialize::serialize_timestamp, types::Uuid};

#[derive(Clone, Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct User {
    #[serde(skip_serializing)]
    pub id: i64,
    #[serde(rename(serialize = "id"))]
    pub public_id: Uuid,
    pub username: String,
    #[serde(skip_serializing)]
    pub password: String,
    #[serde(serialize_with = "serialize_timestamp")]
    pub created_at: i64,
}
