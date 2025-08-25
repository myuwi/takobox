use axum::extract::FromRef;
use axum_extra::extract::cookie::Key;
use sqlx::PgPool;

use crate::config::Config;

#[derive(Clone)]
pub struct AppState {
    pub config: Config,
    pub pool: PgPool,
}

impl FromRef<AppState> for Config {
    fn from_ref(app_state: &AppState) -> Self {
        app_state.config.clone()
    }
}

impl FromRef<AppState> for PgPool {
    fn from_ref(app_state: &AppState) -> Self {
        app_state.pool.clone()
    }
}

impl FromRef<AppState> for Key {
    fn from_ref(state: &AppState) -> Self {
        Key::from(state.config.session_secret.as_bytes())
    }
}
