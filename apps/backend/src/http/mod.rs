use axum::Router;
use sqlx::PgPool;
use tower_http::trace::TraceLayer;

mod auth;
mod error;
mod middleware;
pub mod model;
mod processing;
mod routes;
mod state;

use crate::directories::Directories;
use middleware::rate_limit::rate_limit;
use model::settings::Settings;
use routes::routes;
use state::AppState;

pub fn app(session_secret: String, pool: PgPool, dirs: Directories, settings: Settings) -> Router {
    assert!(
        session_secret.len() >= 64,
        "session_secret must be at least 64 bytes"
    );
    let app_state = AppState {
        session_secret,
        pool,
        dirs,
        settings,
    };

    routes(&app_state)
        .with_state(app_state)
        .layer(rate_limit(500, 120))
        .layer(TraceLayer::new_for_http())
}
