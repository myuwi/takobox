use serde::Serialize;
use sqlx::FromRow;
use time::PrimitiveDateTime;
use uuid::Uuid;

#[derive(Clone, Debug, FromRow, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Collection {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub created_at: PrimitiveDateTime,
}
