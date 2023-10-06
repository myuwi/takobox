use askama::Template;
use axum::{
    response::IntoResponse,
    routing::{get, post, Router},
};
use tower_http::services::ServeDir;

use crate::AppState;

mod error;
mod middleware;
mod register;

pub const AUTH_TOKEN: &str = "AUTH-TOKEN";

#[derive(Template)]
#[template(path = "index.html")]
pub struct Index;

async fn index() -> impl IntoResponse {
    Index {}
}

pub fn routes(state: &AppState) -> Router<AppState> {
    Router::new()
        .route("/", get(index))
        .route("/register", get(register::get))
        .route("/register", post(register::post))
        .layer(axum::middleware::from_fn_with_state(
            state.clone(),
            middleware::auth::auth,
        ))
        .fallback_service(ServeDir::new("public"))
}
