use axum::{
    http::{Method, StatusCode, Uri},
    middleware,
    response::{IntoResponse, Response},
    routing::{Router, get},
};

mod auth;
mod collection_files;
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
    let protected_routes = Router::new()
        .route("/me", get(me::show))
        .nest("/files", files::routes(state))
        .nest("/collections", collections::routes())
        .route_layer(middleware::from_fn(require_auth));

    Router::new()
        .route("/", get(root))
        .route("/settings", get(settings::show))
        .nest("/auth", auth::routes())
        .merge(protected_routes)
        .layer(middleware::from_fn_with_state(state.clone(), auth))
        .fallback(fallback)
}
