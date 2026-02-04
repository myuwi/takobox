use std::sync::LazyLock;

use regex::Regex;
use salvo::{oapi::extract::JsonBody, prelude::*};
use serde::Deserialize;

use crate::{
    auth::password::{hash_password, verify_password},
    error::{Error, ResultExt},
    middleware::rate_limit::rate_limit,
    models::{session::Session, user::User},
    state::AppState,
};

#[derive(Clone, Debug, Deserialize, ToSchema)]
struct AuthPayload {
    pub username: String,
    pub password: String,
}

/// Login
///
/// Log in to a user account
#[endpoint(tags("Auth"), status_codes(200))]
async fn login(
    body: JsonBody<AuthPayload>,
    depot: &mut Depot,
    res: &mut Response,
) -> Result<StatusCode, Error> {
    let AppState {
        pool,
        session_secret,
        ..
    } = depot.obtain::<AppState>().unwrap();

    let user = User::get_by_username(pool, &body.username)
        .await?
        .ok_or_else(|| Error::Unauthorized("Invalid username or password"))?;

    verify_password(&body.password, &user.password)
        .map_err(|_| Error::Unauthorized("Invalid username or password"))?;

    let session = Session::create(pool, user.id).await?;

    res.cookies_mut().private_mut(session_secret).add(session);

    Ok(StatusCode::OK)
}

static VALID_USERNAME_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^[a-z0-9_-]+$").unwrap());

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

/// Register
///
/// Register a user account
#[endpoint(tags("Auth"), status_codes(201))]
async fn register(
    body: JsonBody<AuthPayload>,
    depot: &mut Depot,
    res: &mut Response,
) -> Result<StatusCode, Error> {
    let AppState {
        settings,
        pool,
        session_secret,
        ..
    } = depot.obtain::<AppState>().unwrap();

    if !settings.enable_account_creation {
        return Err(Error::Unauthorized(
            "Account creation is currently disabled for this instance.",
        ));
    }

    validate_register_body(&body).map_err(Error::UnprocessableEntity)?;

    let password_hash = hash_password(&body.password).map_err(|e| Error::Internal(e.into()))?;

    let user = User::create(pool, &body.username, &password_hash)
        .await
        .map_constraint_err("users.username", |_| {
            Error::Conflict("Username is already taken.")
        })?;

    let session = Session::create(pool, user.id).await?;

    res.cookies_mut().private_mut(session_secret).add(session);

    Ok(StatusCode::CREATED)
}

/// Logout
///
/// Log out of a user account, invalidating the login session
#[endpoint(tags("Auth"), status_codes(200))]
async fn logout(
    depot: &mut Depot,
    res: &mut Response,
    session: Session,
) -> Result<StatusCode, Error> {
    let AppState { pool, .. } = depot.obtain::<AppState>().unwrap();

    Session::delete(pool, session.id).await?;

    res.cookies_mut().add(Session::empty_cookie());

    Ok(StatusCode::OK)
}

pub fn routes() -> Router {
    Router::new()
        .push(Router::with_path("/login").hoop(rate_limit(6)).post(login))
        .push(Router::with_path("/register").post(register))
        .push(Router::with_path("/logout").post(logout))
}
