use axum::{
    async_trait,
    extract::{FromRequestParts, State},
    http::{request::Parts, Request},
    middleware::Next,
    response::Response,
};
use sqlx::SqlitePool;
use tower_cookies::{Cookie, Cookies};

use crate::model::user::User;
use crate::web::{
    error::{AuthError, Error, Result},
    AUTH_TOKEN,
};

async fn resolve_user(
    pool: &SqlitePool,
    cookies: &Cookies,
) -> core::result::Result<User, AuthError> {
    let token = cookies
        .get(AUTH_TOKEN)
        .map(|c| c.value().to_string())
        .ok_or(AuthError::NoAuthCookie)?;

    // TODO: Proper token parsing
    let (username, _) = token.split_once('.').ok_or(AuthError::InvalidToken)?;

    sqlx::query_as::<_, User>("SELECT * from users where username = $1")
        .bind(username)
        .fetch_one(pool)
        .await
        .map_err(|err| match err {
            sqlx::Error::RowNotFound => AuthError::UserNotFound,
            _ => AuthError::DatabaseError,
        })
}

pub async fn auth<B>(
    State(pool): State<SqlitePool>,
    cookies: Cookies,
    mut req: Request<B>,
    next: Next<B>,
) -> Result<Response> {
    let result_user = resolve_user(&pool, &cookies).await;

    if !matches!(result_user, Ok(_) | Err(AuthError::NoAuthCookie)) {
        cookies.remove(Cookie::named(AUTH_TOKEN))
    }

    req.extensions_mut().insert(result_user);

    Ok(next.run(req).await)
}

pub async fn require_auth<B>(
    user: Result<User>,
    req: Request<B>,
    next: Next<B>,
) -> Result<Response> {
    user?;

    Ok(next.run(req).await)
}

type UserExtResult = core::result::Result<User, AuthError>;

#[async_trait]
impl<S: Send + Sync> FromRequestParts<S> for User {
    type Rejection = Error;

    async fn from_request_parts(
        parts: &mut Parts,
        _state: &S,
    ) -> core::result::Result<Self, Self::Rejection> {
        parts
            .extensions
            .get::<UserExtResult>()
            .ok_or(Error::Auth(AuthError::UserExtNotFound))?
            .clone()
            .map_err(Error::Auth)
    }
}
