use axum::{Json, Router, extract::State, http::StatusCode, response::IntoResponse, routing::post};
use axum_extra::extract::{PrivateCookieJar, cookie::Cookie};
use lazy_static::lazy_static;
use regex::Regex;
use serde::Deserialize;

use crate::{
    api::{
        auth::password::{hash_password, verify_password},
        error::{Error, ResultExt},
        middleware::rate_limit::rate_limit,
        state::AppState,
    },
    db::{session, user},
    models::session::Session,
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
    let user = user::get_by_username(&pool, &body.username)
        .await?
        .ok_or_else(|| Error::Unauthorized("Invalid username or password"))?;

    verify_password(&body.password, &user.password)
        .map_err(|_| Error::Unauthorized("Invalid username or password"))?;

    let session = session::create(&pool, user.id).await?;

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
    State(AppState { pool, settings, .. }): State<AppState>,
    jar: PrivateCookieJar,
    Json(body): Json<AuthPayload>,
) -> Result<impl IntoResponse, Error> {
    if !settings.enable_account_creation {
        return Err(Error::Unauthorized(
            "Creation of new user accounts is currently disabled for this instance.",
        ));
    }

    validate_register_body(&body).map_err(Error::UnprocessableEntity)?;

    let password_hash = hash_password(&body.password).map_err(|e| Error::Internal(e.into()))?;

    let user = user::create(&pool, &body.username, &password_hash)
        .await
        .on_constraint("users_username_key", |_| {
            Error::Conflict("Username is already taken.")
        })
        .on_constraint("users_username_check", |_| {
            Error::UnprocessableEntity("Username is invalid.")
        })?;

    let session = session::create(&pool, user.id).await?;

    Ok((StatusCode::CREATED, jar.add(session.to_cookie())))
}

async fn logout(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
    jar: PrivateCookieJar,
) -> Result<impl IntoResponse, Error> {
    session::delete(&pool, session.id).await?;

    Ok((StatusCode::OK, jar.remove(Cookie::from("session"))))
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/login", post(login).layer(rate_limit(10_000, 10)))
        .route("/register", post(register))
        .route("/logout", post(logout))
}
