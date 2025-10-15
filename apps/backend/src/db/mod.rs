use sqlx::{
    Sqlite, SqlitePool,
    migrate::{MigrateDatabase, MigrateError},
    sqlite::SqlitePoolOptions,
};

pub mod collection;
pub mod file;
pub mod session;
pub mod user;

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
