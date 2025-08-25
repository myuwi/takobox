use serde::Serialize;
use sqlx::FromRow;
use time::PrimitiveDateTime;
use uuid::Uuid;

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
