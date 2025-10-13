use sqlx::{PgExecutor, postgres::PgRow};
use uuid::Uuid;

use crate::models::{collection::Collection, file::File};

pub async fn get_all_for_user(
    conn: impl PgExecutor<'_>,
    user_id: &Uuid,
) -> Result<Vec<Collection>, sqlx::Error> {
    sqlx::query_as!(
        Collection,
        "select * from collections
        where user_id = $1
        order by name asc",
        user_id,
    )
    .fetch_all(conn)
    .await
}

pub async fn create(
    conn: impl PgExecutor<'_>,
    user_id: &Uuid,
    name: &str,
) -> Result<Collection, sqlx::Error> {
    sqlx::query_as!(
        Collection,
        "insert into collections (user_id, name)
        values ($1, $2)
        returning *",
        user_id,
        name,
    )
    .fetch_one(conn)
    .await
}

pub async fn rename(
    conn: impl PgExecutor<'_>,
    name: &str,
    collection_id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<Collection>, sqlx::Error> {
    sqlx::query_as!(
        Collection,
        "update collections
        set name = $1
        where id = $2 and user_id = $3
        returning *",
        name,
        collection_id,
        user_id,
    )
    .fetch_optional(conn)
    .await
}

pub async fn delete(
    conn: impl PgExecutor<'_>,
    collection_id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<Collection>, sqlx::Error> {
    sqlx::query_as!(
        Collection,
        "delete from collections
        where id = $1 and user_id = $2
        returning *",
        collection_id,
        user_id
    )
    .fetch_optional(conn)
    .await
}

pub async fn get_files(
    conn: impl PgExecutor<'_>,
    collection_id: &Uuid,
    user_id: &Uuid,
) -> Result<Vec<File>, sqlx::Error> {
    sqlx::query_as!(
        File,
        "select f.* from collection_files cf
        join files f on cf.file_id = f.id
        join collections c on cf.collection_id = c.id
        where c.id = $1 and c.user_id = $2
        order by created_at desc",
        collection_id,
        user_id,
    )
    .fetch_all(conn)
    .await
}

pub async fn add_file(
    conn: impl PgExecutor<'_>,
    collection_id: &Uuid,
    file_id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<PgRow>, sqlx::Error> {
    sqlx::query!(
        "insert into collection_files (collection_id, file_id)
            select $1, $2
            where exists (
                select 1
                from collections c
                where c.id = $1
                  and c.user_id = $3
            )",
        collection_id,
        file_id,
        user_id,
    )
    .fetch_optional(conn)
    .await
}

pub async fn remove_file(
    conn: impl PgExecutor<'_>,
    collection_id: &Uuid,
    file_id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<PgRow>, sqlx::Error> {
    sqlx::query!(
        "delete from collection_files
        where collection_id = $1
          and file_id = $2
          and exists (
            select 1
            from collections c
            where c.id = $1
              and c.user_id = $3
        )",
        collection_id,
        file_id,
        user_id,
    )
    .fetch_optional(conn)
    .await
}
