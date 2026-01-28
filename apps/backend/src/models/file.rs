use salvo::oapi::ToSchema;
use serde::Serialize;
use sqlx::{FromRow, SqliteExecutor};

use super::collection::FileCollection;
use crate::{serialize::serialize_timestamp, types::Uid};

#[derive(Clone, Debug, Serialize, FromRow, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct File {
    #[serde(skip_serializing)]
    pub id: i64,
    #[salvo(schema(rename = "id"))]
    #[serde(rename(serialize = "id"))]
    pub public_id: Uid,
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

    pub async fn create(
        conn: impl SqliteExecutor<'_>,
        user_id: i64,
        id: &Uid,
        file_name: &str,
        original_name: &str,
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
        .bind(original_name)
        .bind(file_size)
        .fetch_one(conn)
        .await
    }

    pub async fn rename(
        conn: impl SqliteExecutor<'_>,
        user_id: i64,
        id: &Uid,
        name: &str,
    ) -> Result<Option<File>, sqlx::Error> {
        sqlx::query_as(
            "update files
            set name = $1
            where public_id = $2 and user_id = $3
            returning *",
        )
        .bind(name)
        .bind(id)
        .bind(user_id)
        .fetch_optional(conn)
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
}

#[derive(Clone, Debug, Serialize, FromRow, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct FileWithCollections {
    #[serde(flatten)]
    #[sqlx(flatten)]
    pub file: File,
    #[sqlx(json)]
    pub collections: Vec<FileCollection>,
}

impl FileWithCollections {
    pub async fn get_by_public_id(
        conn: impl SqliteExecutor<'_>,
        user_id: i64,
        id: &Uid,
    ) -> Result<Option<FileWithCollections>, sqlx::Error> {
        sqlx::query_as(
            r#"select 
                f.id, f.public_id, f.user_id, f.filename, f.name, f.size, f.created_at,
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
            group by f.id, f.public_id, f.user_id, f.filename, f.name, f.size, f.created_at"#,
        )
        .bind(id)
        .bind(user_id)
        .fetch_optional(conn)
        .await
    }
}
