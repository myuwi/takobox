use askama::Template;
use axum::{
    response::IntoResponse,
    routing::{get, post, Router},
};
use tower_http::services::ServeDir;

use crate::{model::user::User, AppState};

use super::middleware;

mod logout;
mod register;

#[derive(Template)]
#[template(path = "index.html")]
struct Index {
    user: Option<User>,
}

async fn index(user: Option<User>) -> impl IntoResponse {
    Index { user }
}

pub fn routes(state: &AppState) -> Router<AppState> {
    Router::new()
        .route("/", get(index))
        .route("/logout", get(logout::get))
        .route("/register", get(register::get))
        .route("/register", post(register::post))
        .layer(axum::middleware::from_fn_with_state(
            state.clone(),
            middleware::auth::auth,
        ))
        .fallback_service(ServeDir::new("public"))
}
