use axum::{
    middleware,
    routing::{get, Router},
};
use tower_http::services::ServeDir;

mod index;
mod login;
mod logout;
mod register;

use super::middleware::auth::auth;
use crate::AppState;

pub fn routes(state: &AppState) -> Router<AppState> {
    Router::new()
        .route("/", get(index::get))
        .route("/login", get(login::get).post(login::post))
        .route("/logout", get(logout::get))
        .route("/register", get(register::get).post(register::post))
        .layer(middleware::from_fn_with_state(state.clone(), auth))
        .fallback_service(ServeDir::new("public"))
}
