use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};

use super::middleware::auth::AuthError;

pub type Result<T> = core::result::Result<T, Error>;

#[derive(Clone, Debug)]
pub enum Error {
    Auth(AuthError),
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        match self {
            Self::Auth(_) => (StatusCode::UNAUTHORIZED, "Unauthorized"),
            // _ => (StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error"),
        }
        .into_response()
    }
}
