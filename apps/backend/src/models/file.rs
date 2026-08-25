use std::{ffi::OsStr, path::Path};

use salvo::oapi::ToSchema;
use sanitize_filename::is_sanitized;
use serde::Serialize;
use sqlx::{FromRow, SqliteExecutor};

use crate::{serialize::serialize_timestamp, types::NanoId};

#[derive(Debug)]
pub struct FileName(String);

impl FileName {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<String> for FileName {
    type Error = &'static str;

    fn try_from(s: String) -> Result<Self, Self::Error> {
        let trimmed = s.trim();

        if trimmed.is_empty() {
            return Err("File name must not be empty.");
        }

        if !is_sanitized(trimmed) {
            return Err("File name contains invalid characters.");
        }

        Ok(Self(trimmed.to_owned()))
    }
}

#[derive(Clone, Debug, Serialize, FromRow, ToSchema)]
#[salvo(schema(name = File))]
#[serde(rename_all = "camelCase")]
pub struct File {
    #[serde(skip_serializing)]
    pub id: i64,
    #[salvo(schema(rename = "id"))]
    #[serde(rename(serialize = "id"))]
    pub public_id: NanoId,
    #[serde(skip_serializing)]
    pub user_id: i64,
    pub name: String,
    pub filename: String,
    pub size: i64,
    #[salvo(schema(value_type = String))]
    #[serde(serialize_with = "serialize_timestamp")]
    pub created_at: i64,
}

impl File {
    pub fn parse_rename(&self, new: FileName) -> Result<RenameTo, &'static str> {
        fn extension(name: &str) -> Option<&str> {
            Path::new(name).extension().and_then(OsStr::to_str)
        }

        if extension(new.as_str()) != extension(&self.filename) {
            return Err("New file extension must match the old one.");
        }

        Ok(RenameTo(new))
    }
}

pub struct RenameTo(FileName);

impl RenameTo {
    pub fn as_str(&self) -> &str {
        self.0.as_str()
    }
}

impl File {
    pub async fn get_all_for_user(
        conn: impl SqliteExecutor<'_>,
        user_id: i64,
    ) -> Result<Vec<File>, sqlx::Error> {
        sqlx::query_as(
            "select * from files
            where user_id = $1
            order by id desc",
        )
        .bind(user_id)
        .fetch_all(conn)
        .await
    }

    pub async fn get_by_public_id(
        conn: impl SqliteExecutor<'_>,
        user_id: i64,
        id: &NanoId,
    ) -> Result<Option<File>, sqlx::Error> {
        sqlx::query_as(
            "select * from files
            where public_id = $1 and user_id = $2",
        )
        .bind(id)
        .bind(user_id)
        .fetch_optional(conn)
        .await
    }

    pub async fn create(
        conn: impl SqliteExecutor<'_>,
        user_id: i64,
        id: &NanoId,
        file_name: &str,
        name: &FileName,
        size: &usize,
    ) -> Result<File, sqlx::Error> {
        let file_size = *size as i64;

        sqlx::query_as(
            "insert into files (public_id, user_id, filename, name, size)
            values ($1, $2, $3, $4, $5)
            returning *",
        )
        .bind(id)
        .bind(user_id)
        .bind(file_name)
        .bind(name.as_str())
        .bind(file_size)
        .fetch_one(conn)
        .await
    }

    pub async fn rename(
        conn: impl SqliteExecutor<'_>,
        user_id: i64,
        id: &NanoId,
        name: RenameTo,
    ) -> Result<Option<File>, sqlx::Error> {
        sqlx::query_as(
            "update files
            set name = $1
            where public_id = $2 and user_id = $3
            returning *",
        )
        .bind(name.as_str())
        .bind(id)
        .bind(user_id)
        .fetch_optional(conn)
        .await
    }

    pub async fn delete(
        conn: impl SqliteExecutor<'_>,
        user_id: i64,
        id: &NanoId,
    ) -> Result<Option<File>, sqlx::Error> {
        sqlx::query_as(
            "delete from files 
            where public_id = $1 and user_id = $2
            returning *",
        )
        .bind(id)
        .bind(user_id)
        .fetch_optional(conn)
        .await
    }
}
