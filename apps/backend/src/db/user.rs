use sqlx::PgExecutor;
use uuid::Uuid;

use crate::models::user::User;

pub async fn create(
    conn: impl PgExecutor<'_>,
    username: &str,
    password_hash: &str,
) -> Result<User, sqlx::Error> {
    sqlx::query_as!(
        User,
        "insert into users (username, password) values ($1, $2) returning *",
        username,
        password_hash,
    )
    .fetch_one(conn)
    .await
}

pub async fn get_by_id(
    conn: impl PgExecutor<'_>,
    user_id: &Uuid,
) -> Result<User, sqlx::Error> {
    sqlx::query_as!(User, "select * from users where id = $1", user_id)
        .fetch_one(conn)
        .await
}

pub async fn get_by_username(
    conn: impl PgExecutor<'_>,
    username: &str,
) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as!(User, "select * from users where username = $1", username,)
        .fetch_optional(conn)
        .await
}
