use serde::{Deserialize, Serialize};
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

#[derive(Clone, Debug, FromRow, Deserialize, Serialize)]
pub struct FileCollection {
    pub id: Uuid,
    pub name: String,
}
