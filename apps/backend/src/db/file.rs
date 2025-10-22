use sqlx::SqliteExecutor;

use crate::{
    models::file::{File, FileWithCollections},
    types::Uid,
};

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
    id: &Uid,
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

pub async fn get_with_collections_by_public_id(
    conn: impl SqliteExecutor<'_>,
    user_id: i64,
    id: &Uid,
) -> Result<Option<FileWithCollections>, sqlx::Error> {
    sqlx::query_as(
        r#"select 
            f.id, f.public_id, f.user_id, f.name, f.original, f.size, f.created_at,
            coalesce(
                (
                    select json_group_array(
                        json_object('id', c.id, 'public_id', c.public_id, 'name', c.name)
                    )
                    from collection_files cf 
                    left join collections c on cf.collection_id = c.id 
                    where cf.file_id = f.id
                ), '[]'
            ) as collections
        from files f
        left join collection_files cf on f.id = cf.file_id
        left join collections c on cf.collection_id = c.id
        where f.public_id = $1 and f.user_id = $2
        group by f.id, f.public_id, f.user_id, f.name, f.original, f.size, f.created_at"#,
    )
    .bind(id)
    .bind(user_id)
    .fetch_optional(conn)
    .await
}

pub async fn create(
    conn: impl SqliteExecutor<'_>,
    user_id: i64,
    id: &Uid,
    file_name: &str,
    original_name: &str,
    file_size: &usize,
) -> Result<File, sqlx::Error> {
    let file_size = *file_size as i64;

    sqlx::query_as(
        "insert into files (public_id, user_id, name, original, size)
        values ($1, $2, $3, $4, $5)
        returning *",
    )
    .bind(id)
    .bind(user_id)
    .bind(file_name)
    .bind(original_name)
    .bind(file_size)
    .fetch_one(conn)
    .await
}

pub async fn delete(
    conn: impl SqliteExecutor<'_>,
    user_id: i64,
    id: &Uid,
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
