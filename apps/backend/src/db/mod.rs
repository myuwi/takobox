pub(crate) mod collection_files;
pub(crate) mod collections;
pub(crate) mod files;
pub(crate) mod sessions;
pub(crate) mod users;

use sqlx::{
    Sqlite, SqlitePool,
    error::DatabaseError,
    migrate::{MigrateDatabase, MigrateError},
    sqlite::SqlitePoolOptions,
};

pub const MAX_ID_ATTEMPTS: usize = 5;

pub async fn init_pool(database_path: &str) -> Result<SqlitePool, MigrateError> {
    if !Sqlite::database_exists(database_path).await? {
        Sqlite::create_database(database_path).await?
    }

    let pool = SqlitePoolOptions::new()
        .max_connections(50)
        .connect(database_path)
        .await?;

    sqlx::migrate!().run(&pool).await?;

    Ok(pool)
}

/// `columns` as SQLite names them, e.g. `users.username`.
pub fn violates_constraint(err: &dyn DatabaseError, columns: &str) -> bool {
    err.message()
        .ends_with(&format!(" constraint failed: {columns}"))
}

pub fn is_unique_violation(err: &sqlx::Error, columns: &[&str]) -> bool {
    matches!(err, sqlx::Error::Database(err)
        if err.is_unique_violation() && columns.iter().any(|c| violates_constraint(&**err, c)))
}

#[cfg(test)]
mod tests {
    use sqlx::{Connection, SqliteConnection};

    use super::*;

    async fn setup_db() -> SqliteConnection {
        let mut conn = SqliteConnection::connect("sqlite::memory:").await.unwrap();
        sqlx::query("create table items (id text not null unique, name text not null unique)")
            .execute(&mut conn)
            .await
            .unwrap();
        sqlx::query("insert into items (id, name) values ('taken', 'existing')")
            .execute(&mut conn)
            .await
            .unwrap();
        conn
    }

    #[tokio::test]
    async fn matches_a_conflict_on_a_listed_column() {
        let mut conn = setup_db().await;

        let err = sqlx::query("insert into items (id, name) values ('taken', 'new')")
            .execute(&mut conn)
            .await
            .unwrap_err();

        assert!(is_unique_violation(&err, &["items.id"]));
        assert!(is_unique_violation(&err, &["items.name", "items.id"]));
    }

    #[tokio::test]
    async fn ignores_a_conflict_on_another_column() {
        let mut conn = setup_db().await;

        let err = sqlx::query("insert into items (id, name) values ('free', 'existing')")
            .execute(&mut conn)
            .await
            .unwrap_err();

        assert!(!is_unique_violation(&err, &["items.id"]));
    }

    #[tokio::test]
    async fn ignores_other_constraint_failures() {
        let mut conn = setup_db().await;

        let err = sqlx::query("insert into items (id, name) values (null, 'new')")
            .execute(&mut conn)
            .await
            .unwrap_err();

        assert!(!is_unique_violation(&err, &["items.id"]));
    }
}
