use std::fmt::Debug;

use salvo::{
    Depot, Request, Writer,
    extract::{Extractible, Metadata},
    http::cookie::{Cookie, CookieJar, PrivateJar, SameSite},
    oapi::{Components, EndpointArgRegister, Operation},
};
use sqlx::SqlitePool;
use time::OffsetDateTime;

use crate::{http::error::Error, models::session::Session, types::NanoId};

const COOKIE_NAME: &str = "session";

pub async fn resolve_session(
    pool: &SqlitePool,
    jar: &PrivateJar<&CookieJar>,
) -> Result<Option<Session>, Error> {
    let Some(session_id) = jar
        .get(COOKIE_NAME)
        .and_then(|c| NanoId::try_from(c.value().to_string()).ok())
    else {
        return Ok(None);
    };

    Ok(Session::get_by_public_id(pool, &session_id).await?)
}

fn build_cookie(value: String, expires: OffsetDateTime) -> Cookie<'static> {
    Cookie::build((COOKIE_NAME, value))
        .http_only(true)
        .secure(cfg!(not(debug_assertions)))
        .path("/")
        .expires(expires)
        .same_site(SameSite::Lax)
        .build()
}

impl From<Session> for Cookie<'_> {
    fn from(session: Session) -> Self {
        let expires = OffsetDateTime::from_unix_timestamp(session.expires_at).unwrap();

        build_cookie(session.public_id.to_string(), expires)
    }
}

pub fn clear_session_cookie() -> Cookie<'static> {
    build_cookie(String::new(), OffsetDateTime::now_utc())
}

impl<'ex> Extractible<'ex> for Session {
    fn metadata() -> &'static Metadata {
        static METADATA: Metadata = Metadata::new("Session");
        &METADATA
    }

    async fn extract(
        req: &'ex mut Request,
        _depot: &'ex mut Depot,
    ) -> Result<Self, impl Writer + Send + Debug + 'static> {
        req.extensions()
            .get::<Session>()
            .ok_or(Error::Unauthorized("Unauthorized"))
            .cloned()
    }
}

impl EndpointArgRegister for Session {
    fn register(_components: &mut Components, _operation: &mut Operation, _arg: &str) {}
}
