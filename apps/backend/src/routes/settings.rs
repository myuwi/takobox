use axum::{Json, extract::State};

use crate::{models::settings::Settings, state::AppState};

pub async fn show(State(AppState { settings, .. }): State<AppState>) -> Json<Settings> {
    Json(settings)
}
