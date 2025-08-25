use sqlx::{PgPool, migrate::MigrateError, postgres::PgPoolOptions};

pub async fn init_pool(database_url: &str) -> Result<PgPool, MigrateError> {
    // TODO: Is this needed?
    // if !Postgres::database_exists(database_url).await? {
    //     Postgres::create_database(database_url).await?
    // }

    let pool = PgPoolOptions::new()
        .max_connections(50)
        .connect(database_url)
        .await?;

    // TODO: Migrate?
    // sqlx::migrate!().run(&pool).await?;

    Ok(pool)
}
