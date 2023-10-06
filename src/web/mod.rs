use askama::Template;
use axum::{
    response::IntoResponse,
    routing::{get, post, Router},
};
use tower_http::services::ServeDir;

use crate::AppState;

mod register;

#[derive(Template)]
#[template(path = "index.html")]
pub struct Index;

async fn index() -> impl IntoResponse {
    Index {}
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(index))
        .route("/register", get(register::get))
        .route("/register", post(register::post))
        .fallback_service(ServeDir::new("public"))
}
