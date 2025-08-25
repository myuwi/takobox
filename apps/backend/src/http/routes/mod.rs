use axum::{
    http::{Method, StatusCode, Uri},
    middleware,
    response::{IntoResponse, Response},
    routing::{Router, get},
};

mod auth;
mod collections;
mod files;
mod me;
mod settings;

use super::{
    middleware::auth::{auth, require_auth},
    state::AppState,
};

async fn root() -> Response {
    "Hello Takobox API!".into_response()
}

async fn fallback(method: Method, uri: Uri) -> Response {
    (StatusCode::NOT_FOUND, format!("Cannot {method} {uri}")).into_response()
}

pub fn routes(state: &AppState) -> Router<AppState> {
    Router::new()
        .merge(protected_routes())
        .route("/", get(root))
        .nest("/auth", auth::routes())
        .route("/settings", get(settings::show))
        .layer(middleware::from_fn_with_state(state.clone(), auth))
        .fallback(fallback)
}

pub fn protected_routes() -> Router<AppState> {
    Router::new()
        .route("/me", get(me::show))
        .nest("/collections", collections::routes())
        .nest("/files", files::routes())
        .route_layer(middleware::from_fn(require_auth))
}
