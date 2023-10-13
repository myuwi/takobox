use axum::Router;
use dotenvy::dotenv;
use std::net::SocketAddr;
use std::process::ExitCode;
use tokio::signal::unix::{signal, SignalKind};
use tower_cookies::CookieManagerLayer;

mod config;
mod db;
mod error;
mod model;
mod state;
mod web;

use crate::config::Config;
use crate::error::Result;
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

async fn run() -> Result<()> {
    let config = Config::new()?;

    let pool = db::init_pool(&config.db_path).await?;

    let app_state = AppState { config, pool };

    let app = Router::new()
        .merge(web::routes(&app_state))
        .layer(CookieManagerLayer::new())
        .with_state(app_state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .with_graceful_shutdown(shutdown_signal())
        .await
        .unwrap();

    Ok(())
}

#[tokio::main]
async fn main() -> ExitCode {
    dotenv().ok();

    match run().await {
        Ok(_) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("Error: {e}");
            ExitCode::FAILURE
        }
    }
}
