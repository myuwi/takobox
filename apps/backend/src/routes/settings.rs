use axum::{
    Json,
    extract::State,
    response::{IntoResponse, Response},
};

use crate::state::AppState;

pub async fn show(State(AppState { settings, .. }): State<AppState>) -> Response {
    Json(settings).into_response()
}
