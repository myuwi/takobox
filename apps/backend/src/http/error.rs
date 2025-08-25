use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde::Serialize;

#[derive(thiserror::Error, Clone, Debug)]
pub enum Error {
    #[error("{0}")]
    BadRequest(&'static str),

    #[error("{0}")]
    Unauthorized(&'static str),

    #[error("{0}")]
    NotFound(&'static str),

    #[error("{0}")]
    UnprocessableEntity(&'static str),

    // TODO: Sqlx, etc.
    #[error("Internal Server Error")]
    Internal,
}

#[derive(Serialize)]
struct MessageResponse {
    message: String,
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        let status_code = match self {
            Self::BadRequest(_) => StatusCode::BAD_REQUEST,
            Self::Unauthorized(_) => StatusCode::UNAUTHORIZED,
            Self::NotFound(_) => StatusCode::NOT_FOUND,
            Self::UnprocessableEntity(_) => StatusCode::UNPROCESSABLE_ENTITY,
            Self::Internal => StatusCode::INTERNAL_SERVER_ERROR,
        };

        (
            status_code,
            Json(MessageResponse {
                message: self.to_string(),
            }),
        )
            .into_response()
    }
}
