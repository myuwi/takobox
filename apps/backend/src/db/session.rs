use sqlx::{PgExecutor, postgres::types::PgInterval};
use uuid::Uuid;

use crate::models::session::Session;

// TODO: Clear expired sessions?

const EXPIRATION: PgInterval = PgInterval {
    months: 0,
    days: 30,
    microseconds: 0,
};

pub async fn create(
    conn: impl PgExecutor<'_>,
    user_id: &Uuid,
) -> Result<Session, sqlx::Error> {
    sqlx::query_as!(
        Session,
        "insert into sessions (user_id, expires_at)
        values ($1, now() + $2)
        returning *",
        user_id,
        EXPIRATION,
    )
    .fetch_one(conn)
    .await
}

pub async fn get_by_id(
    conn: impl PgExecutor<'_>,
    session_id: &Uuid,
) -> Result<Session, sqlx::Error> {
    sqlx::query_as!(
        Session,
        "select * from sessions where id = $1 and expires_at > now()",
        session_id,
    )
    .fetch_one(conn)
    .await
}

pub async fn delete(
    conn: impl PgExecutor<'_>,
    session_id: &Uuid,
) -> Result<(), sqlx::Error> {
    sqlx::query!("delete from sessions where id = $1", session_id)
        .execute(conn)
        .await
        .map(|_| ())
}
