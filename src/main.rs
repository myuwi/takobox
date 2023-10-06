use axum::Router;
use sqlx::sqlite::SqlitePoolOptions;
use std::net::SocketAddr;
use tokio::signal::unix::{signal, SignalKind};

mod state;
mod web;

use crate::state::AppState;

#[tokio::main]
async fn main() {
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect("sqlite::memory:")
        .await
        .expect("could not connect to database");

    sqlx::migrate!()
        .run(&pool)
        .await
        .expect("could not migrate database");

    let app_state = AppState { pool };

    let app = Router::new()
        .merge(web::routes())
        .with_state(app_state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .with_graceful_shutdown(shutdown_signal())
        .await
        .unwrap();
}

async fn shutdown_signal() {
    let mut term = signal(SignalKind::terminate()).expect("Failed to register SIGTERM handler");
    let mut interrupt = signal(SignalKind::interrupt()).expect("Failed to register SIGINT handler");

    tokio::select! {
        _ = term.recv() => {},
        _ = interrupt.recv() => {},
    };

    println!("Shutting down gracefully...");
}
