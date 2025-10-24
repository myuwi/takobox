use serde::Serialize;
use sqlx::{FromRow, SqliteExecutor};

use crate::{serialize::serialize_timestamp, types::Uid};

#[derive(Clone, Debug, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct User {
    #[serde(skip_serializing)]
    pub id: i64,
    #[serde(rename(serialize = "id"))]
    pub public_id: Uid,
    pub username: String,
    #[serde(skip_serializing)]
    pub password: String,
    #[serde(serialize_with = "serialize_timestamp")]
    pub created_at: i64,
}

impl User {
    pub async fn create(
        conn: impl SqliteExecutor<'_>,
        username: &str,
        password_hash: &str,
    ) -> Result<User, sqlx::Error> {
        let id = Uid::new(6);

        sqlx::query_as(
            "insert into users (public_id, username, password) values ($1, $2, $3) returning *",
        )
        .bind(id)
        .bind(username)
        .bind(password_hash)
        .fetch_one(conn)
        .await
    }

    pub async fn get_by_id(
        conn: impl SqliteExecutor<'_>,
        user_id: i64,
    ) -> Result<User, sqlx::Error> {
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
}
