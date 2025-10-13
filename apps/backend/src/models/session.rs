use axum_extra::extract::cookie::{Cookie, SameSite};
use sqlx::FromRow;
use time::PrimitiveDateTime;
use uuid::Uuid;

#[derive(Clone, Copy, Debug, FromRow)]
pub struct Session {
    pub id: Uuid,
    pub user_id: Uuid,
    pub created_at: PrimitiveDateTime,
    pub expires_at: PrimitiveDateTime,
}

impl<'a> Session {
    pub fn to_cookie(self) -> Cookie<'a> {
        Cookie::build(("session", self.id.to_string()))
            .http_only(true)
            .secure(true)
            .path("/")
            .expires(self.expires_at.assume_utc())
            .same_site(SameSite::Lax)
            .build()
    }
}
