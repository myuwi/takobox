use sqlx::{migrate::MigrateDatabase, sqlite::SqlitePoolOptions, Sqlite, SqlitePool};

use crate::error::Result;

pub async fn init_pool(db_path: &str) -> Result<SqlitePool> {
    if !Sqlite::database_exists(db_path).await? {
        Sqlite::create_database(db_path).await?
    }

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(db_path)
        .await?;

    sqlx::migrate!().run(&pool).await?;

    Ok(pool)
}
