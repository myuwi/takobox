use axum::extract::FromRef;
use axum_extra::extract::cookie::Key;
use sqlx::PgPool;

use crate::directories::Directories;

use super::model::settings::Settings;

#[derive(Clone)]
pub struct AppState {
    pub session_secret: String,
    pub pool: PgPool,
    pub dirs: Directories,
    pub settings: Settings,
}

impl FromRef<AppState> for Key {
    fn from_ref(state: &AppState) -> Self {
        Key::from(state.session_secret.as_bytes())
    }
}
