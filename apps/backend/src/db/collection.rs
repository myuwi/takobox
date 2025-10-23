use sqlx::{SqliteExecutor, sqlite::SqliteRow};

use crate::{
    models::{collection::Collection, file::File},
    types::Uid,
};

pub async fn get_all_for_user(
    conn: impl SqliteExecutor<'_>,
    user_id: i64,
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

pub async fn exists(
    conn: impl SqliteExecutor<'_>,
    user_id: i64,
    id: &Uid,
) -> Result<bool, sqlx::Error> {
    sqlx::query_scalar(
        "select count(*) > 0 from collections
        where public_id = $1 and user_id = $2",
    )
    .bind(id)
    .bind(user_id)
    .fetch_one(conn)
    .await
}

pub async fn create(
    conn: impl SqliteExecutor<'_>,
    user_id: i64,
    name: &str,
) -> Result<Collection, sqlx::Error> {
    let id = Uid::new(6);

    sqlx::query_as(
        "insert into collections (public_id, user_id, name)
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
    user_id: i64,
    collection_id: &Uid,
    name: &str,
) -> Result<Option<Collection>, sqlx::Error> {
    sqlx::query_as(
        "update collections
        set name = $1
        where public_id = $2 and user_id = $3
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
    user_id: i64,
    collection_id: &Uid,
) -> Result<Option<Collection>, sqlx::Error> {
    sqlx::query_as(
        "delete from collections
        where public_id = $1 and user_id = $2
        returning *",
    )
    .bind(collection_id)
    .bind(user_id)
    .fetch_optional(conn)
    .await
}

pub async fn get_files(
    conn: impl SqliteExecutor<'_> + Copy,
    user_id: i64,
    collection_id: &Uid,
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

pub async fn add_file(
    conn: impl SqliteExecutor<'_>,
    user_id: i64,
    collection_id: &Uid,
    file_id: &Uid,
) -> Result<Option<SqliteRow>, sqlx::Error> {
    sqlx::query(
        "insert into collection_files (collection_id, file_id)
        select c.id, f.id
        from collections c
        join files f on f.public_id = $2 
        where c.public_id = $1
          and c.user_id = $3
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
    user_id: i64,
    collection_id: &Uid,
    file_id: &Uid,
) -> Result<Option<SqliteRow>, sqlx::Error> {
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
}
