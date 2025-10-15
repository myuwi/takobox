use serde::Serialize;
use sqlx::FromRow;

use crate::types::Uuid;

#[derive(Clone, Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: Uuid,
    pub username: String,
    #[serde(skip_serializing)]
    pub password: String,
    pub created_at: i64,
}
