use salvo::http::cookie::{Cookie, SameSite};
use sqlx::{FromRow, SqliteExecutor};
use time::{Duration, OffsetDateTime, UtcDateTime};

use crate::types::Uid;

// TODO: Clear expired sessions?

const EXPIRATION: Duration = Duration::days(30);

#[derive(Clone, Debug, FromRow)]
pub struct Session {
    pub id: i64,
    pub public_id: Uid,
    pub user_id: i64,
    pub created_at: i64,
    pub expires_at: i64,
}

impl From<Session> for Cookie<'_> {
    fn from(session: Session) -> Self {
        Cookie::build(("session", session.public_id.to_string()))
            .http_only(true)
            .secure(true)
            .path("/")
            .expires(OffsetDateTime::from_unix_timestamp(session.expires_at).unwrap())
            .same_site(SameSite::Lax)
            .build()
    }
}

impl Session {
    pub fn empty_cookie<'c>() -> Cookie<'c> {
        Cookie::build(("session", ""))
            .http_only(true)
            .secure(true)
            .path("/")
            .expires(OffsetDateTime::now_utc())
            .same_site(SameSite::Lax)
            .build()
    }
}

impl Session {
    pub async fn create(
        conn: impl SqliteExecutor<'_>,
        user_id: i64,
    ) -> Result<Session, sqlx::Error> {
        let id = Uid::new(32);
        let expires_at = (UtcDateTime::now() + EXPIRATION).unix_timestamp();

        sqlx::query_as(
            "insert into sessions (public_id, user_id, expires_at)
            values ($1, $2, $3)
            returning *",
        )
        .bind(id)
        .bind(user_id)
        .bind(expires_at)
        .fetch_one(conn)
        .await
    }

    pub async fn get_by_public_id(
        conn: impl SqliteExecutor<'_>,
        session_id: &Uid,
    ) -> Result<Session, sqlx::Error> {
        sqlx::query_as("select * from sessions where public_id = $1 and expires_at > unixepoch()")
            .bind(session_id)
            .fetch_one(conn)
            .await
    }

    pub async fn delete(conn: impl SqliteExecutor<'_>, session_id: i64) -> Result<(), sqlx::Error> {
        sqlx::query("delete from sessions where id = $1")
            .bind(session_id)
            .execute(conn)
            .await
            .map(|_| ())
    }
}
