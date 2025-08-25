use tracing_subscriber::EnvFilter;

mod config;
mod db;
mod http;

use crate::config::Config;

pub const UPLOADS_PATH: &str = "../../uploads";
pub const THUMBS_PATH: &str = "../../uploads/thumbs";

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| {
            format!(
                "{}=debug,tower_http=debug,axum::rejection=trace",
                env!("CARGO_CRATE_NAME")
            )
            .into()
        }))
        .init();

    let config = Config::from_env()?;
    let pool = db::init_pool(&config.database_url).await?;

    http::serve(config, pool).await
}
