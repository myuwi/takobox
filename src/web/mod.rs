use askama::Template;
use axum::{
    response::IntoResponse,
    routing::{get, Router},
};

#[derive(Template)]
#[template(path = "index.html")]
pub struct Index;

async fn index() -> impl IntoResponse {
    Index {}
}

pub fn routes() -> Router {
    Router::new().route("/", get(index))
}
