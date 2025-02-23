use sqlx::{
    migrate::{MigrateDatabase, MigrateError},
    sqlite::SqlitePoolOptions,
    Sqlite, SqlitePool,
};

pub async fn init_pool(db_path: &str) -> Result<SqlitePool, MigrateError> {
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
