use salvo::oapi::ToSchema;
use serde::Serialize;

use crate::{
    db::users::User,
    domain::user::{Role, UserId},
    http::serialize::serialize_timestamp,
};

#[derive(Clone, Debug, Serialize, ToSchema)]
#[salvo(schema(name = User))]
#[serde(rename_all = "camelCase")]
pub struct UserResponse {
    pub id: UserId,
    pub username: String,
    pub role: Role,
    #[salvo(schema(value_type = String))]
    #[serde(serialize_with = "serialize_timestamp")]
    pub created_at: i64,
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        Self {
            id: user.public_id,
            username: user.username,
            role: user.role,
            created_at: user.created_at,
        }
    }
}
