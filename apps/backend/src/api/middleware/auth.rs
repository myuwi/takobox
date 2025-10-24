use axum::{
    body::Body,
    extract::{FromRequestParts, State},
    http::{Request, request::Parts},
    middleware::Next,
    response::Response,
};
use axum_extra::extract::PrivateCookieJar;
use sqlx::SqlitePool;

use crate::{
    api::{error::Error, state::AppState},
    models::session::Session,
    types::Uid,
};

async fn resolve_session(pool: &SqlitePool, jar: PrivateCookieJar) -> Option<Session> {
    let session_id = jar
        .get("session")
        .and_then(|c| Uid::try_from(c.value().to_string()).ok())?;

    Session::get_by_public_id(pool, &session_id).await.ok()
}

pub async fn auth(
    State(AppState { pool, .. }): State<AppState>,
    jar: PrivateCookieJar,
    mut req: Request<Body>,
    next: Next,
) -> Result<Response, Error> {
    if let Some(session) = resolve_session(&pool, jar).await {
        req.extensions_mut().insert(session);
    }

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

impl<S: Send + Sync> FromRequestParts<S> for Session {
    type Rejection = Error;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        parts
            .extensions
            .get::<Session>()
            .ok_or(Error::Unauthorized("Unauthorized"))
            .cloned()
    }
}
