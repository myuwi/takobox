use sqlx::{
    PgPool, Postgres,
    migrate::{MigrateDatabase, MigrateError},
    postgres::PgPoolOptions,
};

pub mod collection;
pub mod file;
pub mod session;
pub mod user;

pub async fn init_pool(database_url: &str) -> Result<PgPool, MigrateError> {
    if !Postgres::database_exists(database_url).await? {
        Postgres::create_database(database_url).await?
    }

    let pool = PgPoolOptions::new()
        .max_connections(50)
        .connect(database_url)
        .await?;

    sqlx::migrate!().run(&pool).await?;

    Ok(pool)
}
