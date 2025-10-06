use std::env;

use tokio::net::TcpListener;
use tokio::signal::unix::SignalKind;
use tokio::signal::unix::signal;
use tracing::debug;
use tracing_subscriber::EnvFilter;

use takobox::app;

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

    let database_url = env::var("DATABASE_URL")?;
    let session_secret = env::var("SESSION_SECRET")?;

    let pool = db::init_pool(&database_url).await?;

    let listener = TcpListener::bind("0.0.0.0:8000").await?;
    debug!("Listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app(session_secret, pool))
        .with_graceful_shutdown(shutdown_signal())
        .await?;
    Ok(())
}
