use std::env;

use tokio::net::TcpListener;
use tokio::signal::unix::SignalKind;
use tokio::signal::unix::signal;
use tracing::debug;
use tracing_subscriber::EnvFilter;

use takobox::Directories;
use takobox::app;
use takobox::model::settings::Settings;

mod db;

async fn shutdown_signal() {
    let mut term = signal(SignalKind::terminate()).expect("Failed to register SIGTERM handler");
    let mut interrupt = signal(SignalKind::interrupt()).expect("Failed to register SIGINT handler");

    tokio::select! {
        _ = term.recv() => {},
        _ = interrupt.recv() => {},
    };

    debug!("Shutting down gracefully...");
}

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

    let session_secret = env::var("TAKOBOX_SESSION_SECRET")?;
    let database_url = env::var("TAKOBOX_DATABASE_URL")?;
    let pool = db::init_pool(&database_url).await?;
    let settings = Settings::from_env()?;

    let data_dir = env::var("TAKOBOX_DATA_DIR").unwrap_or("takobox_data".to_string());
    let dirs = Directories::new(data_dir);
    dirs.create_all().await?;

    let app = app(session_secret, pool, dirs, settings);

    let listener = TcpListener::bind("0.0.0.0:8000").await?;
    debug!("Listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;
    Ok(())
}
