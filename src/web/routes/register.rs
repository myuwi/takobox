use askama::Template;
use axum::{extract::State, response::IntoResponse, Form};
use sqlx::SqlitePool;
use tower_cookies::{cookie::SameSite, Cookie, Cookies};
use uuid::Uuid;

use crate::{
    model::user::UserAuth,
    web::{
        auth::hash_password,
        partials::{AuthErrors, AuthFields},
        AUTH_TOKEN,
    },
};

#[derive(Template, Default)]
#[template(path = "register.html")]
pub struct Register {
    pub errors: AuthErrors,
}

pub async fn get() -> impl IntoResponse {
    Register::default()
}

pub async fn post(
    State(pool): State<SqlitePool>,
    cookies: Cookies,
    Form(form_data): Form<UserAuth>,
) -> Result<impl IntoResponse, AuthFields> {
    // TODO: Better form validation
    if !(4..=32).contains(&form_data.username.len()) {
        return Err(AuthFields::with_username_error(
            "Username must be between 4 and 32 characters",
        ));
    }

    if !(6..=64).contains(&form_data.password.len()) {
        return Err(AuthFields::with_password_error(
            "Password must be between 6 and 64 characters",
        ));
    }

    let password_hash = hash_password(&form_data.password)
        .map_err(|_| AuthFields::with_password_error("Invalid password"))?;

    let res = sqlx::query("INSERT INTO users (id, username, password) VALUES ($1, $2, $3)")
        .bind(Uuid::new_v4())
        .bind(&form_data.username)
        .bind(&password_hash)
        .execute(&pool)
        .await;

    res.map_err(|err| {
        // TODO: Better error messages
        match err.as_database_error().map(|e| e.kind()) {
            Some(sqlx::error::ErrorKind::UniqueViolation) => {
                AuthFields::with_username_error("Username is already taken")
            }
            _ => AuthFields::with_username_error("Unable to create account"),
        }
    })?;

    // TODO: Generate a real token
    let auth_cookie = Cookie::build(AUTH_TOKEN, format!("{}.fake.token", &form_data.username))
        .same_site(SameSite::Strict)
        .http_only(true)
        .finish();
    cookies.add(auth_cookie);

    Ok([("HX-Redirect", "/")])
}
