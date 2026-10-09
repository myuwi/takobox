use salvo::{oapi::extract::JsonBody, prelude::*};
use serde::Deserialize;
use tracing::info;

use crate::{
    auth::password::{Password, hash_password, verify_password},
    db::{self, sessions::Session},
    http::{
        error::{Error, ResultExt},
        middleware::rate_limit::rate_limit,
        response::UserResponse,
        session::clear_session_cookie,
        state::AppState,
        status::{Created, NoContent},
    },
    models::user::Username,
};

#[derive(Clone, Debug, Deserialize, ToSchema)]
#[salvo(schema(name = AuthCredentials))]
struct AuthCredentials {
    pub username: String,
    pub password: String,
}

/// Login
///
/// Log in to a user account
#[endpoint(
    operation_id = "auth.login",
    tags("Auth"),
    request_body = AuthCredentials
)]
async fn login(
    body: JsonBody<AuthCredentials>,
    depot: &mut Depot,
    res: &mut Response,
) -> Result<Json<UserResponse>, Error> {
    let AppState {
        pool,
        session_secret,
        ..
    } = depot.get_typed::<AppState>().unwrap();

    let user = db::users::get_by_username(pool, &body.username)
        .await?
        .ok_or_else(|| Error::Unauthorized("Invalid username or password"))?;

    verify_password(&body.password, &user.password).map_err(|e| match e {
        argon2::password_hash::Error::Password => {
            Error::Unauthorized("Invalid username or password")
        }
        e => Error::internal("failed to verify password", e),
    })?;

    let session = db::sessions::create(pool, user.id).await?;

    res.cookies_mut().private_mut(session_secret).add(session);

    Ok(Json(user.into()))
}

/// Register
///
/// Register a user account
#[endpoint(
    operation_id = "auth.register",
    tags("Auth"),
    request_body = AuthCredentials
)]
async fn register(
    body: JsonBody<AuthCredentials>,
    depot: &mut Depot,
    res: &mut Response,
) -> Result<Created<Json<UserResponse>>, Error> {
    let AppState {
        settings,
        pool,
        session_secret,
        ..
    } = depot.get_typed::<AppState>().unwrap();

    if !settings.enable_account_creation {
        return Err(Error::Forbidden(
            "Account creation is currently disabled for this instance.",
        ));
    }

    let username = Username::try_from(body.username.clone()).map_err(Error::UnprocessableEntity)?;
    let password = Password::try_from(body.password.clone()).map_err(Error::UnprocessableEntity)?;

    let password_hash =
        hash_password(&password).map_err(|e| Error::internal("failed to hash password", e))?;

    let user = db::users::create(pool, &username, &password_hash)
        .await
        .map_constraint_err("users.username", |_| {
            Error::Conflict("Username is already taken.")
        })?;
    info!(user_id = user.id, "account created");

    let session = db::sessions::create(pool, user.id).await?;

    res.cookies_mut().private_mut(session_secret).add(session);

    Ok(Created::new("/api/me", Json(user.into())))
}

/// Logout
///
/// Log out of a user account, invalidating the login session
#[endpoint(operation_id = "auth.logout", tags("Auth"))]
async fn logout(
    depot: &mut Depot,
    res: &mut Response,
    session: Session,
) -> Result<NoContent, Error> {
    let AppState { pool, .. } = depot.get_typed::<AppState>().unwrap();

    db::sessions::delete(pool, session.id).await?;

    res.cookies_mut().add(clear_session_cookie());

    Ok(NoContent)
}

pub fn routes() -> Router {
    Router::new()
        .push(Router::with_path("/login").hoop(rate_limit(6)).post(login))
        .push(
            Router::with_path("/register")
                .hoop(rate_limit(6))
                .post(register),
        )
        .push(Router::with_path("/logout").post(logout))
}
