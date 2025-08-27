use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde::Serialize;
use tracing::error;

#[derive(thiserror::Error, Debug)]
pub enum Error {
    #[error("{0}")]
    BadRequest(&'static str),

    #[error("{0}")]
    Unauthorized(&'static str),

    #[error("{0}")]
    NotFound(&'static str),

    #[error("{0}")]
    Conflict(&'static str),

    #[error("{0}")]
    UnprocessableEntity(&'static str),

    #[error("Internal Server Error")]
    Sqlx(#[from] sqlx::Error),

    #[error("Internal Server Error")]
    Internal(#[from] anyhow::Error),
}

#[derive(Serialize)]
struct ErrorResponse {
    message: String,
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        let status_code = match self {
            Self::BadRequest(_) => StatusCode::BAD_REQUEST,
            Self::Unauthorized(_) => StatusCode::UNAUTHORIZED,
            Self::NotFound(_) => StatusCode::NOT_FOUND,
            Self::Conflict(_) => StatusCode::CONFLICT,
            Self::UnprocessableEntity(_) => StatusCode::UNPROCESSABLE_ENTITY,
            Self::Sqlx(_) | Self::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
        };

        match self {
            Self::Sqlx(ref e) => error!("{:?}", e),
            Self::Internal(ref e) => error!("{:?}", e),
            _ => (),
        }

        (
            status_code,
            Json(ErrorResponse {
                message: self.to_string(),
            }),
        )
            .into_response()
    }
}

pub trait ResultExt<T> {
    fn on_constraint<F>(self, name: &str, map_err: F) -> Result<T, Error>
    where
        F: FnOnce(Box<dyn sqlx::error::DatabaseError>) -> Error;
}

impl<T, E> ResultExt<T> for Result<T, E>
where
    E: Into<Error>,
{
    fn on_constraint<F>(self, name: &str, map_err: F) -> Result<T, Error>
    where
        F: FnOnce(Box<dyn sqlx::error::DatabaseError>) -> Error,
    {
        self.map_err(|e| match e.into() {
            Error::Sqlx(sqlx::Error::Database(e)) if e.constraint() == Some(name) => map_err(e),
            e => e,
        })
    }
}
