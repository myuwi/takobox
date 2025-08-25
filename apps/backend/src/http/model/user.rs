use serde::Serialize;
use sqlx::FromRow;
use time::PrimitiveDateTime;
use uuid::Uuid;

#[derive(Clone, Debug, FromRow, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: Uuid,
    pub username: String,
    #[serde(skip_serializing)]
    pub password: String,
    pub created_at: PrimitiveDateTime,
}
