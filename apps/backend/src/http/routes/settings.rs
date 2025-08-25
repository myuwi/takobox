use axum::{
    Json,
    response::{IntoResponse, Response},
};

use crate::http::model::settings::Settings;

pub async fn show() -> Response {
    Json(Settings::default()).into_response()
}
