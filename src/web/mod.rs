use askama::Template;
use axum::{
    response::IntoResponse,
    routing::{get, Router},
};
use tower_http::services::ServeDir;

use crate::AppState;

#[derive(Template)]
#[template(path = "index.html")]
pub struct Index;

async fn index() -> impl IntoResponse {
    Index {}
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(index))
        .fallback_service(ServeDir::new("public"))
}
