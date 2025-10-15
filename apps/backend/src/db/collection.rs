use sqlx::{SqliteExecutor, sqlite::SqliteRow};

use crate::{
    models::{collection::Collection, file::File},
    types::Uuid,
};

pub async fn get_all_for_user(
    conn: impl SqliteExecutor<'_>,
    user_id: &Uuid,
) -> Result<Vec<Collection>, sqlx::Error> {
    sqlx::query_as(
        "select * from collections
        where user_id = $1
        order by name asc",
    )
    .bind(user_id)
    .fetch_all(conn)
    .await
}

pub async fn create(
    conn: impl SqliteExecutor<'_>,
    user_id: &Uuid,
    name: &str,
) -> Result<Collection, sqlx::Error> {
    let id = Uuid::new();

    sqlx::query_as(
        "insert into collections (id, user_id, name)
        values ($1, $2, $3)
        returning *",
    )
    .bind(id)
    .bind(user_id)
    .bind(name)
    .fetch_one(conn)
    .await
}

pub async fn rename(
    conn: impl SqliteExecutor<'_>,
    name: &str,
    collection_id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<Collection>, sqlx::Error> {
    sqlx::query_as(
        "update collections
        set name = $1
        where id = $2 and user_id = $3
        returning *",
    )
    .bind(name)
    .bind(collection_id)
    .bind(user_id)
    .fetch_optional(conn)
    .await
}

pub async fn delete(
    conn: impl SqliteExecutor<'_>,
    collection_id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<Collection>, sqlx::Error> {
    sqlx::query_as(
        "delete from collections
        where id = $1 and user_id = $2
        returning *",
    )
    .bind(collection_id)
    .bind(user_id)
    .fetch_optional(conn)
    .await
}

pub async fn get_files(
    conn: impl SqliteExecutor<'_>,
    collection_id: &Uuid,
    user_id: &Uuid,
) -> Result<Vec<File>, sqlx::Error> {
    sqlx::query_as(
        "select f.* from collection_files cf
        join files f on cf.file_id = f.id
        join collections c on cf.collection_id = c.id
        where c.id = $1 and c.user_id = $2
        order by created_at desc",
    )
    .bind(collection_id)
    .bind(user_id)
    .fetch_all(conn)
    .await
}

pub async fn add_file(
    conn: impl SqliteExecutor<'_>,
    collection_id: &Uuid,
    file_id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<SqliteRow>, sqlx::Error> {
    sqlx::query(
        "insert into collection_files (collection_id, file_id)
        select $1, $2
        where exists (
            select 1
            from collections c
            where c.id = $1
              and c.user_id = $3
        )
        returning *",
    )
    .bind(collection_id)
    .bind(file_id)
    .bind(user_id)
    .fetch_optional(conn)
    .await
}

pub async fn remove_file(
    conn: impl SqliteExecutor<'_>,
    collection_id: &Uuid,
    file_id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<SqliteRow>, sqlx::Error> {
    sqlx::query(
        "delete from collection_files
        where collection_id = $1
            and file_id = $2
            and exists (
            select 1
            from collections c
            where c.id = $1
              and c.user_id = $3
        )
        returning *",
    )
    .bind(collection_id)
    .bind(file_id)
    .bind(user_id)
    .fetch_optional(conn)
    .await
}
