use axum::{Json, Router, extract::State, routing::post};
use axum::{http::StatusCode, response::IntoResponse};
use axum_extra::extract::PrivateCookieJar;
use axum_extra::extract::cookie::Cookie;
use lazy_static::lazy_static;
use regex::Regex;
use serde::Deserialize;

use crate::http::{
    auth::{
        password::{hash_password, verify_password},
        session::{Session, create_session, delete_session},
    },
    error::Error,
    model::user::User,
    state::AppState,
};

#[derive(Clone, Debug, Deserialize)]
struct AuthPayload {
    pub username: String,
    pub password: String,
}

async fn login(
    State(AppState { pool, .. }): State<AppState>,
    jar: PrivateCookieJar,
    Json(body): Json<AuthPayload>,
) -> Result<impl IntoResponse, Error> {
    let user = sqlx::query_as!(
        User,
        "select * from users where username = $1",
        &body.username,
    )
    .fetch_one(&pool)
    .await
    .map_err(|_| Error::Unauthorized("Invalid username or password"))?;

    verify_password(&body.password, &user.password)
        .map_err(|_| Error::Unauthorized("Invalid username or password"))?;

    let session = create_session(&pool, &user.id)
        .await
        .map_err(|_| Error::Internal)?;

    Ok((StatusCode::OK, jar.add(session.to_cookie())))
}

lazy_static! {
    static ref VALID_USERNAME_REGEX: Regex = Regex::new(r"^[a-z0-9_-]+$").unwrap();
}

fn validate_register_body(body: &AuthPayload) -> Result<(), Error> {
    if !VALID_USERNAME_REGEX.is_match(&body.username) {
        return Err(Error::UnprocessableEntity(
            "Username may only contain lowercase letters (a-z), numbers (0-9), underscores (_), and hyphens (-).",
        ));
    }

    if !(4..=32).contains(&body.username.len()) {
        return Err(Error::UnprocessableEntity(
            "Username must be between 4 and 32 characters",
        ));
    }

    if !(6..=64).contains(&body.password.len()) {
        return Err(Error::UnprocessableEntity(
            "Password must be between 6 and 64 characters",
        ));
    }

    Ok(())
}

async fn register(
    State(AppState { pool, .. }): State<AppState>,
    jar: PrivateCookieJar,
    Json(body): Json<AuthPayload>,
) -> Result<impl IntoResponse, Error> {
    validate_register_body(&body)?;

    let password_hash = hash_password(&body.password).map_err(|_| Error::Internal)?;

    let user = sqlx::query_as!(
        User,
        "insert into users (username, password) values ($1, $2) returning *",
        &body.username,
        &password_hash,
    )
    .fetch_one(&pool)
    .await
    .map_err(|err| {
        // TODO: Better error handling
        match err.as_database_error().and_then(|e| e.constraint()) {
            Some("users_username_key") => Error::UnprocessableEntity("Username is already taken."),
            Some("users_username_check") => Error::UnprocessableEntity("Username is invalid."),
            _ => Error::Internal,
        }
    })?;

    let session = create_session(&pool, &user.id)
        .await
        .map_err(|_| Error::Internal)?;

    Ok((StatusCode::CREATED, jar.add(session.to_cookie())))
}

async fn logout(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
    jar: PrivateCookieJar,
) -> Result<impl IntoResponse, Error> {
    delete_session(&pool, &session.id)
        .await
        .map_err(|_| Error::Internal)?;

    Ok((StatusCode::OK, jar.remove(Cookie::from("session"))))
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/login", post(login))
        .route("/register", post(register))
        .route("/logout", post(logout))
}
