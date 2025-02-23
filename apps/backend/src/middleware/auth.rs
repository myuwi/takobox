use axum::{
    async_trait,
    body::Body,
    extract::{FromRequestParts, State},
    http::{header, request::Parts, HeaderMap, Request},
    middleware::Next,
    response::Response,
};
use sqlx::SqlitePool;

use crate::{
    auth::jwt::{decode_jwt, Claims},
    config::Config,
    error::{AuthError, Error, Result},
    model::user::User,
    state::AppState,
};

async fn resolve_user(
    pool: &SqlitePool,
    config: &Config,
    headers: &HeaderMap,
) -> core::result::Result<User, AuthError> {
    let token = headers
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "))
        .ok_or(AuthError::InvalidToken)?;

    let Claims { sub: id, .. } =
        decode_jwt(token, &config.session_secret).map_err(|err| match err.kind() {
            jsonwebtoken::errors::ErrorKind::ExpiredSignature => AuthError::ExpiredToken,
            _ => AuthError::InvalidToken,
        })?;

    sqlx::query_as::<_, User>("SELECT * from users where id = $1")
        .bind(id)
        .fetch_one(pool)
        .await
        .map_err(|err| match err {
            sqlx::Error::RowNotFound => AuthError::UserNotFound,
            _ => AuthError::DatabaseError,
        })
}

pub async fn auth(
    State(AppState { config, pool }): State<AppState>,
    mut req: Request<Body>,
    next: Next,
) -> Result<Response> {
    let result_user = resolve_user(&pool, &config, req.headers()).await;
    req.extensions_mut().insert(result_user);

    Ok(next.run(req).await)
}

pub async fn require_auth(user: Result<User>, req: Request<Body>, next: Next) -> Result<Response> {
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
