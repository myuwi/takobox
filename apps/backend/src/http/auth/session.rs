use axum_extra::extract::cookie::{Cookie, SameSite};
use sqlx::{FromRow, PgPool, postgres::types::PgInterval};
use time::PrimitiveDateTime;
use uuid::Uuid;

const EXPIRATION: PgInterval = PgInterval {
    months: 0,
    days: 30,
    microseconds: 0,
};

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

pub async fn create_session(pool: &PgPool, user_id: &Uuid) -> Result<Session, sqlx::Error> {
    sqlx::query_as!(
        Session,
        "insert into sessions (user_id, expires_at)
        values ($1, now() + $2)
        returning *",
        user_id,
        EXPIRATION,
    )
    .fetch_one(pool)
    .await
}

pub async fn get_session(pool: &PgPool, session_id: &Uuid) -> Result<Session, sqlx::Error> {
    sqlx::query_as!(
        Session,
        "select * from sessions where id = $1 and expires_at > now()",
        session_id,
    )
    .fetch_one(pool)
    .await
}

pub async fn delete_session(pool: &PgPool, session_id: &Uuid) -> Result<(), sqlx::Error> {
    sqlx::query!("delete from sessions where id = $1", session_id)
        .execute(pool)
        .await
        .map(|_| ())
}
