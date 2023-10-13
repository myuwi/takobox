use axum::Router;
use dotenvy::dotenv;
use sqlx::{migrate::MigrateDatabase, sqlite::SqlitePoolOptions, Sqlite};
use std::net::SocketAddr;
use tokio::signal::unix::{signal, SignalKind};
use tower_cookies::CookieManagerLayer;

mod config;
mod model;
mod state;
mod web;

use crate::config::Config;
use crate::state::AppState;

#[tokio::main]
async fn main() {
    dotenv().ok();

    let config = Config::new().expect("Unable to construct Config");
    let db_path = &config.db_path;

    if !Sqlite::database_exists(db_path).await.unwrap_or(false) {
        Sqlite::create_database(db_path).await.unwrap();
    }

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(db_path)
        .await
        .expect("could not connect to database");

    sqlx::migrate!()
        .run(&pool)
        .await
        .expect("could not migrate database");

    let app_state = AppState { config, pool };

    let app = Router::new()
        .merge(web::routes(&app_state))
        .layer(CookieManagerLayer::new())
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
