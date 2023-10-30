use axum::response::{IntoResponse, Redirect};
use tower_cookies::{Cookie, Cookies};

use crate::web::AUTH_TOKEN;

pub async fn get(cookies: Cookies) -> impl IntoResponse {
    cookies.remove(Cookie::new(AUTH_TOKEN, ""));

    Redirect::to("/")
}
