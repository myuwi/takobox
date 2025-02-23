use axum::Router;
use dotenvy::dotenv;
use tokio::net::TcpListener;
use tokio::signal::unix::{signal, SignalKind};

mod auth;
mod config;
mod db;
mod error;
mod middleware;
mod model;
mod routes;
mod state;

use crate::config::Config;
use crate::routes::routes;
use crate::state::AppState;

async fn shutdown_signal() {
    let mut term = signal(SignalKind::terminate()).expect("Failed to register SIGTERM handler");
    let mut interrupt = signal(SignalKind::interrupt()).expect("Failed to register SIGINT handler");

    tokio::select! {
        _ = term.recv() => {},
        _ = interrupt.recv() => {},
    };

    println!("Shutting down gracefully...");
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenv().ok();
    let config = Config::load()?;
    config.validate()?;

    let pool = db::init_pool(&config.db_path).await?;

    let app_state = AppState { config, pool };

    let app = Router::new()
        .nest("/api", routes(&app_state))
        .with_state(app_state);

    let listener = TcpListener::bind("127.0.0.1:3000").await?;
    axum::serve(listener, app.into_make_service())
        .with_graceful_shutdown(shutdown_signal())
        .await
        .unwrap();

    Ok(())
}
