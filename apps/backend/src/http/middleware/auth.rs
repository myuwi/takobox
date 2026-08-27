use salvo::{Depot, Request, Writer, handler};

use crate::{
    http::{error::Error, session::resolve_session, state::AppState},
    models::session::Session,
};

#[handler]
pub async fn inject_auth(depot: &mut Depot, req: &mut Request) -> Result<(), Error> {
    let AppState {
        pool,
        session_secret,
        ..
    } = depot.get_typed::<AppState>().unwrap();

    if let Some(session) = resolve_session(pool, &req.cookies().private(session_secret)).await? {
        req.extensions_mut().insert(session);
    }

    Ok(())
}

#[handler]
pub async fn require_auth(_session: Session) {}
