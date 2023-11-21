use askama::Template;
use axum::{extract::State, response::IntoResponse, Form};
use tower_cookies::Cookies;
use uuid::Uuid;

use crate::{
    model::user::UserAuth,
    state::AppState,
    web::{
        auth::{create_auth_cookie, create_jwt, hash_password},
        partials::{AuthErrors, AuthFields},
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
    State(AppState { config, pool }): State<AppState>,
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

    let uuid = Uuid::new_v4();

    let res = sqlx::query("INSERT INTO users (id, username, password) VALUES ($1, $2, $3)")
        .bind(uuid)
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

    let token = create_jwt(&uuid, &config.session_secret)
        .map_err(|_| AuthFields::with_username_error("Unable to start session"))?;

    let auth_cookie = create_auth_cookie(token);
    cookies.add(auth_cookie);

    Ok([("HX-Redirect", "/")])
}
