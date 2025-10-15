use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use crate::types::Uuid;

#[derive(Clone, Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Collection {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub created_at: i64,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct FileCollection {
    pub id: Uuid,
    pub name: String,
}
