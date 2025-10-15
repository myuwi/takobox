use sqlx::SqliteExecutor;

use crate::{models::user::User, types::Uuid};

pub async fn create(
    conn: impl SqliteExecutor<'_>,
    username: &str,
    password_hash: &str,
) -> Result<User, sqlx::Error> {
    let id = Uuid::new();

    sqlx::query_as("insert into users (id, username, password) values ($1, $2, $3) returning *")
        .bind(id)
        .bind(username)
        .bind(password_hash)
        .fetch_one(conn)
        .await
}

pub async fn get_by_id(conn: impl SqliteExecutor<'_>, user_id: &Uuid) -> Result<User, sqlx::Error> {
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
