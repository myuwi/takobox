use std::sync::LazyLock;

use regex::Regex;
use salvo::oapi::ToSchema;
use serde::Serialize;
use sqlx::{FromRow, SqliteExecutor};

use crate::{serialize::serialize_timestamp, types::NanoId};

static VALID_USERNAME_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^[a-z0-9_-]+$").unwrap());

#[derive(Debug)]
pub struct Username(String);

impl Username {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<String> for Username {
    type Error = &'static str;

    fn try_from(s: String) -> Result<Self, Self::Error> {
        if !VALID_USERNAME_REGEX.is_match(&s) {
            return Err(
                "Username may only contain lowercase letters (a-z), numbers (0-9), underscores (_), and hyphens (-).",
            );
        }

        if !(4..=32).contains(&s.len()) {
            return Err("Username must be between 4 and 32 characters");
        }

        Ok(Self(s))
    }
}

#[derive(Clone, Debug, Serialize, FromRow, ToSchema)]
#[salvo(schema(name = User))]
#[serde(rename_all = "camelCase")]
pub struct User {
    #[serde(skip_serializing)]
    pub id: i64,
    #[salvo(schema(rename = "id"))]
    #[serde(rename(serialize = "id"))]
    pub public_id: NanoId,
    pub username: String,
    #[serde(skip_serializing)]
    pub password: String,
    #[salvo(schema(value_type = String))]
    #[serde(serialize_with = "serialize_timestamp")]
    pub created_at: i64,
}

impl User {
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
