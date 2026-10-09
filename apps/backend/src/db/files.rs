use sqlx::{FromRow, SqliteExecutor};

use crate::domain::file::{FileId, FileName, FileRename};

#[derive(Clone, Debug, FromRow)]
pub struct File {
    pub id: i64,
    pub public_id: FileId,
    #[expect(dead_code)]
    pub user_id: i64,
    pub name: String,
    pub filename: String,
    pub size: i64,
    pub created_at: i64,
}

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
    id: &FileId,
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
    id: &FileId,
    filename: &str,
    name: &FileName,
    size: i64,
) -> Result<File, sqlx::Error> {
    sqlx::query_as(
        "insert into files (public_id, user_id, filename, name, size)
        values ($1, $2, $3, $4, $5)
        returning *",
    )
    .bind(id)
    .bind(user_id)
    .bind(filename)
    .bind(name.as_str())
    .bind(size)
    .fetch_one(conn)
    .await
}

pub async fn rename(
    conn: impl SqliteExecutor<'_>,
    user_id: i64,
    id: &FileId,
    rename: FileRename,
) -> Result<Option<File>, sqlx::Error> {
    sqlx::query_as(
        "update files
        set name = $1
        where public_id = $2 and user_id = $3
        returning *",
    )
    .bind(rename.name().as_str())
    .bind(id)
    .bind(user_id)
    .fetch_optional(conn)
    .await
}

pub async fn delete(
    conn: impl SqliteExecutor<'_>,
    user_id: i64,
    id: &FileId,
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
