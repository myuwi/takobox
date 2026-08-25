use salvo::{
    http::header::{self, HeaderValue},
    oapi::extract::JsonBody,
    prelude::*,
};
use serde::Deserialize;

use crate::{
    auth::password::{Password, hash_password, verify_password},
    error::{Error, ResultExt},
    middleware::rate_limit::rate_limit,
    models::{
        session::Session,
        user::{User, Username},
    },
    response::UserResponse,
    state::AppState,
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
#[endpoint(operation_id = "auth.login", tags("Auth"), status_codes(200))]
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

    let user = User::get_by_username(pool, &body.username)
        .await?
        .ok_or_else(|| Error::Unauthorized("Invalid username or password"))?;

    verify_password(&body.password, &user.password)
        .map_err(|_| Error::Unauthorized("Invalid username or password"))?;

    let session = Session::create(pool, user.id).await?;

    res.cookies_mut().private_mut(session_secret).add(session);

    Ok(Json(user.into()))
}

/// Register
///
/// Register a user account
#[endpoint(
    operation_id = "auth.register",
    tags("Auth"),
    responses(
        (status_code = 201, description = "User created", body = UserResponse)
    ),
    status_codes(201)
)]
async fn register(
    body: JsonBody<AuthCredentials>,
    depot: &mut Depot,
    res: &mut Response,
) -> Result<Json<UserResponse>, Error> {
    let AppState {
        settings,
        pool,
        session_secret,
        ..
    } = depot.get_typed::<AppState>().unwrap();

    if !settings.enable_account_creation {
        return Err(Error::Unauthorized(
            "Account creation is currently disabled for this instance.",
        ));
    }

    let username = Username::try_from(body.username.clone()).map_err(Error::UnprocessableEntity)?;
    let password = Password::try_from(body.password.clone()).map_err(Error::UnprocessableEntity)?;

    let password_hash = hash_password(&password).map_err(|e| Error::Internal(e.into()))?;

    let user = User::create(pool, &username, &password_hash)
        .await
        .map_constraint_err("users.username", |_| {
            Error::Conflict("Username is already taken.")
        })?;

    let session = Session::create(pool, user.id).await?;

    res.cookies_mut().private_mut(session_secret).add(session);
    res.status_code(StatusCode::CREATED);
    res.headers_mut()
        .insert(header::LOCATION, HeaderValue::from_static("/api/me"));

    Ok(Json(user.into()))
}

/// Logout
///
/// Log out of a user account, invalidating the login session
#[endpoint(operation_id = "auth.logout", tags("Auth"), status_codes(204))]
async fn logout(
    depot: &mut Depot,
    res: &mut Response,
    session: Session,
) -> Result<StatusCode, Error> {
    let AppState { pool, .. } = depot.get_typed::<AppState>().unwrap();

    Session::delete(pool, session.id).await?;

    res.cookies_mut().add(Session::empty_cookie());

    Ok(StatusCode::NO_CONTENT)
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
