use axum::{
    http::{Method, StatusCode, Uri},
    middleware,
    response::IntoResponse,
    routing::{get, Router},
};

mod auth;

use super::middleware::auth::auth;
use crate::AppState;

async fn hello() -> impl IntoResponse {
    "Welcome to the Takobox API!"
}

async fn fallback(method: Method, uri: Uri) -> impl IntoResponse {
    (StatusCode::NOT_FOUND, format!("Cannot {method} {uri}"))
}

pub fn routes(state: &AppState) -> Router<AppState> {
    Router::new()
        .route("/", get(hello))
        .nest("/auth", auth::routes())
        .layer(middleware::from_fn_with_state(state.clone(), auth))
        .fallback(fallback)
}
