use salvo::{Depot, Request, Writer, handler};

use crate::{models::session::Session, session::resolve_session, state::AppState};

#[handler]
pub async fn inject_auth(depot: &mut Depot, req: &mut Request) {
    let AppState {
        pool,
        session_secret,
        ..
    } = depot.get_typed::<AppState>().unwrap();

    if let Some(session) = resolve_session(pool, &req.cookies().private(session_secret)).await {
        req.extensions_mut().insert(session);
    }
}

#[handler]
pub async fn require_auth(_session: Session) {}
