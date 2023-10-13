use axum::extract::FromRef;
use sqlx::SqlitePool;

use crate::config::Config;

#[derive(Clone)]
pub struct AppState {
    pub config: Config,
    pub pool: SqlitePool,
}

impl FromRef<AppState> for Config {
    fn from_ref(app_state: &AppState) -> Self {
        app_state.config.clone()
    }
}

impl FromRef<AppState> for SqlitePool {
    fn from_ref(app_state: &AppState) -> Self {
        app_state.pool.clone()
    }
}
