use sqlx::{FromRow, SqliteExecutor, sqlite::SqliteRow};

use super::file::File;
use crate::types::NanoId;

#[derive(Debug)]
pub struct CollectionName(String);

impl CollectionName {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<String> for CollectionName {
    type Error = &'static str;

    fn try_from(s: String) -> Result<Self, Self::Error> {
        let trimmed = s.trim();

        if trimmed.is_empty() {
            return Err("Collection name must not be empty.");
        }

        Ok(Self(trimmed.to_owned()))
    }
}

#[allow(dead_code)]
#[derive(Clone, Debug, FromRow)]
pub struct Collection {
    pub id: i64,
    pub public_id: NanoId,
    pub user_id: i64,
    pub name: String,
    pub created_at: i64,
}

impl Collection {
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

    pub async fn get_all_for_file(
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

    pub async fn exists(
        conn: impl SqliteExecutor<'_>,
        user_id: i64,
        id: &NanoId,
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
        let id = NanoId::new(6);

        sqlx::query_as(
            "insert into collections (public_id, user_id, name)
            values ($1, $2, $3)
            returning *",
        )
        .bind(id)
        .bind(user_id)
        .bind(name.as_str())
        .fetch_one(conn)
        .await
    }

    pub async fn rename(
        conn: impl SqliteExecutor<'_>,
        user_id: i64,
        collection_id: &NanoId,
        name: &CollectionName,
    ) -> Result<Option<Collection>, sqlx::Error> {
        sqlx::query_as(
            "update collections
            set name = $1
            where public_id = $2 and user_id = $3
            returning *",
        )
        .bind(name.as_str())
        .bind(collection_id)
        .bind(user_id)
        .fetch_optional(conn)
        .await
    }

    pub async fn delete(
        conn: impl SqliteExecutor<'_>,
        user_id: i64,
        collection_id: &NanoId,
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
        collection_id: &NanoId,
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
        collection_id: &NanoId,
        file_id: &NanoId,
    ) -> Result<Option<SqliteRow>, sqlx::Error> {
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
    }

    pub async fn remove_file(
        conn: impl SqliteExecutor<'_>,
        user_id: i64,
        collection_id: &NanoId,
        file_id: &NanoId,
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
}
