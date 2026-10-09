use sqlx::SqliteExecutor;

use crate::{
    db::{collections::Collection, files::File},
    domain::{collection::CollectionId, file::FileId},
};

pub async fn get_files(
    conn: impl SqliteExecutor<'_>,
    user_id: i64,
    collection_id: &CollectionId,
) -> Result<Vec<File>, sqlx::Error> {
    sqlx::query_as(
        "select f.* from collection_files cf
        join files f on cf.file_id = f.id
        join collections c on cf.collection_id = c.id
        where c.public_id = $1 and c.user_id = $2
        order by id desc",
    )
    .bind(collection_id)
    .bind(user_id)
    .fetch_all(conn)
    .await
}

pub async fn get_collections(
    conn: impl SqliteExecutor<'_>,
    user_id: i64,
    file_id: i64,
) -> Result<Vec<Collection>, sqlx::Error> {
    sqlx::query_as(
        "select c.* from collections c
        join collection_files cf on cf.collection_id = c.id
        where cf.file_id = $1 and c.user_id = $2
        order by c.name asc",
    )
    .bind(file_id)
    .bind(user_id)
    .fetch_all(conn)
    .await
}

pub async fn add(
    conn: impl SqliteExecutor<'_>,
    user_id: i64,
    collection_id: &CollectionId,
    file_id: &FileId,
) -> Result<Option<()>, sqlx::Error> {
    sqlx::query(
        "insert into collection_files (collection_id, file_id)
        select c.id, f.id
        from collections c
        join files f on f.public_id = $2
        where c.public_id = $1
          and c.user_id = $3
          and f.user_id = $3
        on conflict (collection_id, file_id) do update
          set collection_id = excluded.collection_id
        returning *",
    )
    .bind(collection_id)
    .bind(file_id)
    .bind(user_id)
    .fetch_optional(conn)
    .await
    .map(|row| row.map(|_| ()))
}

pub async fn remove(
    conn: impl SqliteExecutor<'_>,
    user_id: i64,
    collection_id: &CollectionId,
    file_id: &FileId,
) -> Result<Option<()>, sqlx::Error> {
    sqlx::query(
        "delete from collection_files
        where collection_id = (
            select c.id
            from collections c
            where c.public_id = $1
              and c.user_id = $3
        )
        and file_id = (
            select f.id
            from files f
            where f.public_id = $2
        )
        returning *",
    )
    .bind(collection_id)
    .bind(file_id)
    .bind(user_id)
    .fetch_optional(conn)
    .await
    .map(|row| row.map(|_| ()))
}
