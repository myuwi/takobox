use axum_extra::extract::cookie::{Cookie, SameSite};
use sqlx::FromRow;
use time::OffsetDateTime;

use crate::types::Uid;

#[derive(Clone, Debug, FromRow)]
pub struct Session {
    pub id: i64,
    pub public_id: Uid,
    pub user_id: i64,
    pub created_at: i64,
    pub expires_at: i64,
}

impl<'a> Session {
    pub fn to_cookie(self) -> Cookie<'a> {
        Cookie::build(("session", self.public_id.to_string()))
            .http_only(true)
            .secure(true)
            .path("/")
            .expires(OffsetDateTime::from_unix_timestamp(self.expires_at).unwrap())
            .same_site(SameSite::Lax)
            .build()
    }
}
