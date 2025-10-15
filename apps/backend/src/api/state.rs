use anyhow::ensure;
use axum::extract::FromRef;
use axum_extra::extract::cookie::Key;
use sqlx::SqlitePool;

use crate::{directories::Directories, models::settings::Settings};

#[derive(Clone)]
pub struct AppState {
    pub session_secret: String,
    pub pool: SqlitePool,
    pub dirs: Directories,
    pub settings: Settings,
}

impl AppState {
    pub fn try_from(
        session_secret: String,
        pool: SqlitePool,
        dirs: Directories,
        settings: Settings,
    ) -> anyhow::Result<Self> {
        ensure!(
            session_secret.len() >= 64,
            "session_secret must be at least 64 bytes"
        );

        Ok(Self {
            session_secret,
            pool,
            dirs,
            settings,
        })
    }
}

impl FromRef<AppState> for Key {
    fn from_ref(state: &AppState) -> Self {
        Key::from(state.session_secret.as_bytes())
    }
}
