use sqlx::PgExecutor;
use uuid::Uuid;

use crate::models::{
    collection::FileCollection,
    file::{File, FileWithCollections},
};

pub async fn get_all_for_user(
    conn: impl PgExecutor<'_>,
    user_id: &Uuid,
) -> Result<Vec<File>, sqlx::Error> {
    sqlx::query_as!(
        File,
        "select * from files
        where user_id = $1
        order by created_at desc",
        user_id,
    )
    .fetch_all(conn)
    .await
}

pub async fn get_by_id(
    conn: impl PgExecutor<'_>,
    file_id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<File>, sqlx::Error> {
    sqlx::query_as!(
        File,
        "select * from files
        where id = $1 and user_id = $2",
        file_id,
        user_id,
    )
    .fetch_optional(conn)
    .await
}

pub async fn get_with_collections_by_id(
    conn: impl PgExecutor<'_>,
    file_id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<FileWithCollections>, sqlx::Error> {
    sqlx::query_as!(
        FileWithCollections,
        r#"select 
            f.id, f.user_id, f.name, f.original, f.size, f.created_at,
            coalesce(
                json_agg(
                    json_build_object('id', c.id, 'name', c.name)
                ) filter (where c.id is not null),
                '[]'
            ) as "collections!: sqlx::types::Json<Vec<FileCollection>>"
        from files f
        left join collection_files cf on f.id = cf.file_id
        left join collections c on cf.collection_id = c.id
        where f.id = $1 and f.user_id = $2
        group by f.id, f.user_id, f.name, f.original, f.size, f.created_at"#,
        file_id,
        user_id,
    )
    .fetch_optional(conn)
    .await
}

pub async fn create(
    conn: impl PgExecutor<'_>,
    user_id: &Uuid,
    file_name: &str,
    original_name: &str,
    file_size: &usize,
) -> Result<File, sqlx::Error> {
    sqlx::query_as!(
        File,
        "insert into files (user_id, name, original, size)
        values ($1, $2, $3, $4)
        returning *",
        user_id,
        file_name,
        original_name,
        *file_size as i64,
    )
    .fetch_one(conn)
    .await
}

pub async fn delete(
    conn: impl PgExecutor<'_>,
    file_id: &Uuid,
    user_id: &Uuid,
) -> Result<Option<File>, sqlx::Error> {
    sqlx::query_as!(
        File,
        "delete from files 
        where id = $1 and user_id = $2
        returning *",
        file_id,
        user_id,
    )
    .fetch_optional(conn)
    .await
}
