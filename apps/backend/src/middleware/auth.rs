use std::fmt::Debug;

use salvo::{
    Depot, Request, Writer,
    extract::{Extractible, Metadata},
    handler,
    http::cookie::{CookieJar, PrivateJar},
};
use sqlx::SqlitePool;

use crate::{error::Error, models::session::Session, state::AppState, types::Uid};

async fn resolve_session(pool: &SqlitePool, jar: &PrivateJar<&CookieJar>) -> Option<Session> {
    let session_id = jar
        .get("session")
        .and_then(|c| Uid::try_from(c.value().to_string()).ok())?;

    Session::get_by_public_id(pool, &session_id).await.ok()
}

#[handler]
pub async fn inject_auth(depot: &mut Depot, req: &mut Request) {
    let AppState {
        pool,
        session_secret,
        ..
    } = depot.obtain::<AppState>().unwrap();

    if let Some(session) = resolve_session(pool, &req.cookies().private(session_secret)).await {
        req.extensions_mut().insert(session);
    }
}

#[handler]
pub async fn require_auth(_session: Session) {}

impl<'ex> Extractible<'ex> for Session {
    fn metadata() -> &'static Metadata {
        static METADATA: Metadata = Metadata::new("Session");
        &METADATA
    }

    async fn extract(req: &'ex mut Request) -> Result<Self, impl Writer + Send + Debug + 'static> {
        req.extensions()
            .get::<Session>()
            .ok_or(Error::Unauthorized("Unauthorized"))
            .cloned()
    }
}
