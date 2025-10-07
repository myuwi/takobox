use axum::Router;
use middleware::rate_limit::rate_limit;
use model::settings::Settings;
use sqlx::PgPool;
use state::AppState;
use tower_http::trace::TraceLayer;

mod auth;
mod error;
mod middleware;
pub mod model;
mod processing;
mod routes;
mod state;

use crate::http::routes::routes;

pub fn app(session_secret: String, pool: PgPool, settings: Settings) -> Router {
    assert!(
        session_secret.len() >= 64,
        "session_secret must be at least 64 bytes"
    );
    let app_state = AppState {
        session_secret,
        pool,
        settings,
    };

    routes(&app_state)
        .with_state(app_state)
        .layer(rate_limit(500, 120))
        .layer(TraceLayer::new_for_http())
}
