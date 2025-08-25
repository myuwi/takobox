use std::str::FromStr;

use axum::{
    body::Body,
    extract::{FromRequestParts, State},
    http::{Request, request::Parts},
    middleware::Next,
    response::Response,
};
use axum_extra::extract::PrivateCookieJar;
use sqlx::PgPool;
use uuid::Uuid;

use crate::http::{
    auth::session::{Session, get_session},
    error::Error,
    state::AppState,
};

async fn resolve_session(pool: &PgPool, jar: PrivateCookieJar) -> Result<Session, Error> {
    let session_id = jar
        .get("session")
        .and_then(|c| Uuid::from_str(c.value()).ok())
        .ok_or(Error::Unauthorized("Unauthorized"))?;

    get_session(pool, &session_id)
        .await
        .map_err(|_| Error::Unauthorized("Unauthorized"))
}

pub async fn auth(
    State(AppState { pool, .. }): State<AppState>,
    jar: PrivateCookieJar,
    mut req: Request<Body>,
    next: Next,
) -> Result<Response, Error> {
    let result_session = resolve_session(&pool, jar).await;
    req.extensions_mut().insert(result_session);

    Ok(next.run(req).await)
}

pub async fn require_auth(
    session: Result<Session, Error>,
    req: Request<Body>,
    next: Next,
) -> Result<Response, Error> {
    session?;

    Ok(next.run(req).await)
}

type SessionExtResult = Result<Session, Error>;

impl<S: Send + Sync> FromRequestParts<S> for Session {
    type Rejection = Error;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        parts
            .extensions
            .get::<SessionExtResult>()
            .ok_or(Error::Unauthorized("Unauthorized"))?
            .clone()
    }
}
