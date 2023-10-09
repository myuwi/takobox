use askama::Template;
use axum::{extract::State, response::IntoResponse, Form};
use sqlx::SqlitePool;
use tower_cookies::{Cookie, Cookies};
use uuid::Uuid;

use crate::{model::user::UserAuth, web::AUTH_TOKEN};

#[derive(Template)]
#[template(path = "register.html")]
struct Register {}

pub async fn get() -> impl IntoResponse {
    Register {}
}

pub async fn post(
    State(pool): State<SqlitePool>,
    cookies: Cookies,
    Form(form_data): Form<UserAuth>,
) -> impl IntoResponse {
    // TODO: Out of Band updates
    if !(4..=32).contains(&form_data.username.len()) {
        return "Username must be between 4 and 32 characters".into_response();
    }
    if !(6..=64).contains(&form_data.password.len()) {
        return "Password must be between 6 and 64 characters".into_response();
    }

    // TODO: Validate form data
    let res = sqlx::query("INSERT INTO users (id, username, password) VALUES ($1, $2, $3)")
        .bind(Uuid::new_v4())
        .bind(&form_data.username)
        // TODO: Don't insert as plain text
        .bind(&form_data.password)
        .execute(&pool)
        .await;

    if let Err(err) = res {
        // TODO: Better error messages
        let msg = match err
            .as_database_error()
            .map(|e| e.code().unwrap_or_default())
            .unwrap_or_default()
            .to_string()
            .as_str()
        {
            "2067" => "Username is already taken",
            _ => "Unable to create account",
        };

        return msg.into_response();
    }

    cookies.add(Cookie::new(
        AUTH_TOKEN,
        format!("{}.fake.token", &form_data.username),
    ));

    ([("HX-Redirect", "/")], "").into_response()
}
