use sqlx::{FromRow, SqliteExecutor};

use crate::{domain::user::Username, types::NanoId};

#[derive(Clone, Debug, FromRow)]
pub struct User {
    pub id: i64,
    pub public_id: NanoId,
    pub username: String,
    pub password: String,
    pub created_at: i64,
}

pub async fn create(
    conn: impl SqliteExecutor<'_>,
    username: &Username,
    password_hash: &str,
) -> Result<User, sqlx::Error> {
    let id = NanoId::new(6);

    sqlx::query_as(
        "insert into users (public_id, username, password) values ($1, $2, $3) returning *",
    )
    .bind(id)
    .bind(username.as_str())
    .bind(password_hash)
    .fetch_one(conn)
    .await
}

pub async fn get_by_id(conn: impl SqliteExecutor<'_>, user_id: i64) -> Result<User, sqlx::Error> {
    sqlx::query_as("select * from users where id = $1")
        .bind(user_id)
        .fetch_one(conn)
        .await
}

pub async fn get_by_username(
    conn: impl SqliteExecutor<'_>,
    username: &str,
) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as("select * from users where username = $1")
        .bind(username)
        .fetch_optional(conn)
        .await
}
