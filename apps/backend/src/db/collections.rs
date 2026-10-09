use sqlx::{FromRow, SqliteExecutor};

use crate::domain::collection::{CollectionId, CollectionName};

#[derive(Clone, Debug, FromRow)]
pub struct Collection {
    #[expect(dead_code)]
    pub id: i64,
    pub public_id: CollectionId,
    #[expect(dead_code)]
    pub user_id: i64,
    pub name: String,
    pub created_at: i64,
}

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

pub async fn get_by_public_id(
    conn: impl SqliteExecutor<'_>,
    user_id: i64,
    id: &CollectionId,
) -> Result<Option<Collection>, sqlx::Error> {
    sqlx::query_as(
        "select * from collections
        where public_id = $1 and user_id = $2",
    )
    .bind(id)
    .bind(user_id)
    .fetch_optional(conn)
    .await
}

pub async fn exists(
    conn: impl SqliteExecutor<'_>,
    user_id: i64,
    id: &CollectionId,
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
    name: &CollectionName,
) -> Result<Collection, sqlx::Error> {
    let public_id = CollectionId::generate(6);

    sqlx::query_as(
        "insert into collections (public_id, user_id, name)
        values ($1, $2, $3)
        returning *",
    )
    .bind(public_id)
    .bind(user_id)
    .bind(name.as_str())
    .fetch_one(conn)
    .await
}

pub async fn rename(
    conn: impl SqliteExecutor<'_>,
    user_id: i64,
    id: &CollectionId,
    name: &CollectionName,
) -> Result<Option<Collection>, sqlx::Error> {
    sqlx::query_as(
        "update collections
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
    id: &CollectionId,
) -> Result<Option<Collection>, sqlx::Error> {
    sqlx::query_as(
        "delete from collections
        where public_id = $1 and user_id = $2
        returning *",
    )
    .bind(id)
    .bind(user_id)
    .fetch_optional(conn)
    .await
}
