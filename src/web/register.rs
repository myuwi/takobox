use askama::Template;
use axum::{extract::State, response::IntoResponse, Form};
use serde::Deserialize;
use sqlx::SqlitePool;
use tower_cookies::{Cookie, Cookies};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct RegisterPayload {
    pub username: String,
    pub password: String,
}

#[derive(Template)]
#[template(path = "register.html")]
struct Register {}

pub async fn get() -> impl IntoResponse {
    Register {}
}

pub async fn post(
    State(pool): State<SqlitePool>,
    cookies: Cookies,
    Form(form_data): Form<RegisterPayload>,
) -> impl IntoResponse {
    // TODO: Validate form data
    let res = sqlx::query("INSERT INTO users (id, username, password) VALUES ($1, $2, $3)")
        .bind(Uuid::new_v4())
        .bind(&form_data.username)
        // TODO: Don't insert as plain text
        .bind(&form_data.password)
        .execute(&pool)
        .await;

    dbg!(&res);

    if res.is_err() {
        // TODO: Better error messages
        return "Unable to create account".into_response();
    }

    cookies.add(Cookie::new(
        "AUTH-TOKEN",
        format!("{}.fake.token", &form_data.username),
    ));

    ([("HX-Redirect", "/")], "").into_response()
}
