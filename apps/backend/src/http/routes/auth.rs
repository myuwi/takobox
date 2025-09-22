use axum::{Json, Router, extract::State, routing::post};
use axum::{http::StatusCode, response::IntoResponse};
use axum_extra::extract::PrivateCookieJar;
use axum_extra::extract::cookie::Cookie;
use lazy_static::lazy_static;
use regex::Regex;
use serde::Deserialize;

use crate::http::error::ResultExt;
use crate::http::middleware::rate_limit::rate_limit;
use crate::http::{
    auth::password::{hash_password, verify_password},
    error::Error,
    model::{
        session::{Session, create_session, delete_session},
        user::User,
    },
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
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| Error::Unauthorized("Invalid username or password"))?;

    verify_password(&body.password, &user.password)
        .map_err(|_| Error::Unauthorized("Invalid username or password"))?;

    let session = create_session(&pool, &user.id).await?;

    Ok((StatusCode::OK, jar.add(session.to_cookie())))
}

lazy_static! {
    static ref VALID_USERNAME_REGEX: Regex = Regex::new(r"^[a-z0-9_-]+$").unwrap();
}

fn validate_register_body(body: &AuthPayload) -> Result<(), &'static str> {
    if !VALID_USERNAME_REGEX.is_match(&body.username) {
        return Err(
            "Username may only contain lowercase letters (a-z), numbers (0-9), underscores (_), and hyphens (-).",
        );
    }

    if !(4..=32).contains(&body.username.len()) {
        return Err("Username must be between 4 and 32 characters");
    }

    if !(6..=64).contains(&body.password.len()) {
        return Err("Password must be between 6 and 64 characters");
    }

    Ok(())
}

async fn register(
    State(AppState { pool, .. }): State<AppState>,
    jar: PrivateCookieJar,
    Json(body): Json<AuthPayload>,
) -> Result<impl IntoResponse, Error> {
    validate_register_body(&body).map_err(Error::UnprocessableEntity)?;

    let password_hash = hash_password(&body.password).map_err(|e| Error::Internal(e.into()))?;

    let user = sqlx::query_as!(
        User,
        "insert into users (username, password) values ($1, $2) returning *",
        &body.username,
        &password_hash,
    )
    .fetch_one(&pool)
    .await
    .on_constraint("users_username_key", |_| {
        Error::Conflict("Username is already taken.")
    })
    .on_constraint("users_username_check", |_| {
        Error::UnprocessableEntity("Username is invalid.")
    })?;

    let session = create_session(&pool, &user.id).await?;

    Ok((StatusCode::CREATED, jar.add(session.to_cookie())))
}

async fn logout(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
    jar: PrivateCookieJar,
) -> Result<impl IntoResponse, Error> {
    delete_session(&pool, &session.id).await?;

    Ok((StatusCode::OK, jar.remove(Cookie::from("session"))))
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/login", post(login).layer(rate_limit(10_000, 10)))
        .route("/register", post(register))
        .route("/logout", post(logout))
}
