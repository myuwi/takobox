use middleware::rate_limit::rate_limit;
use sqlx::PgPool;
use state::AppState;
use tokio::net::TcpListener;
use tokio::signal::unix::{SignalKind, signal};
use tower_http::trace::TraceLayer;
use tracing::debug;

mod auth;
mod error;
mod middleware;
mod model;
mod processing;
mod routes;
mod state;

use crate::config::Config;
use crate::http::routes::routes;

async fn shutdown_signal() {
    let mut term = signal(SignalKind::terminate()).expect("Failed to register SIGTERM handler");
    let mut interrupt = signal(SignalKind::interrupt()).expect("Failed to register SIGINT handler");

    tokio::select! {
        _ = term.recv() => {},
        _ = interrupt.recv() => {},
    };

    debug!("Shutting down gracefully...");
}

pub async fn serve(config: Config, pool: PgPool) -> anyhow::Result<()> {
    let app_state = AppState { config, pool };
    let app = routes(&app_state)
        .with_state(app_state)
        .layer(rate_limit(500, 120))
        .layer(TraceLayer::new_for_http());

    let listener = TcpListener::bind("0.0.0.0:8000").await?;
    debug!("Listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app.into_make_service())
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}
