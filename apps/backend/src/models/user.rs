use serde::Serialize;
use sqlx::FromRow;

use crate::{serialize::serialize_timestamp, types::Uuid};

#[derive(Clone, Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: Uuid,
    pub username: String,
    #[serde(skip_serializing)]
    pub password: String,
    #[serde(serialize_with = "serialize_timestamp")]
    pub created_at: i64,
}
