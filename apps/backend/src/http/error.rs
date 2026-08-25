use salvo::{oapi, prelude::*};
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

    #[error("Too many requests. Try again later.")]
    TooManyRequests,

    #[error("{message}")]
    Status {
        status: StatusCode,
        message: &'static str,
    },

    #[error("Internal Server Error")]
    Sqlx(#[from] sqlx::Error),

    #[error("Internal Server Error")]
    Internal(#[from] anyhow::Error),
}

impl EndpointOutRegister for Error {
    fn register(components: &mut salvo::oapi::Components, operation: &mut salvo::oapi::Operation) {
        operation.responses.insert(
            "4XX",
            oapi::Response::new("Error response")
                .add_content("application/json", ErrorResponse::to_schema(components)),
        );

        operation.responses.insert(
            "5XX",
            oapi::Response::new("Server error response")
                .add_content("application/json", ErrorResponse::to_schema(components)),
        );
    }
}

#[derive(Serialize, ToSchema)]
#[salvo(schema(name = ErrorResponse))]
struct ErrorResponse {
    message: String,
}

impl Error {
    fn status_code(&self) -> StatusCode {
        match self {
            Self::BadRequest(_) => StatusCode::BAD_REQUEST,
            Self::Unauthorized(_) => StatusCode::UNAUTHORIZED,
            Self::NotFound(_) => StatusCode::NOT_FOUND,
            Self::Conflict(_) => StatusCode::CONFLICT,
            Self::UnprocessableEntity(_) => StatusCode::UNPROCESSABLE_ENTITY,
            Self::TooManyRequests => StatusCode::TOO_MANY_REQUESTS,
            Self::Status { status, .. } => *status,
            Self::Sqlx(_) | Self::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    pub fn from_status_code(status: StatusCode) -> Self {
        match status {
            StatusCode::TOO_MANY_REQUESTS => Self::TooManyRequests,
            _ => Self::Status {
                status,
                message: status.canonical_reason().unwrap_or("Request failed"),
            },
        }
    }
}

#[async_trait]
impl Writer for Error {
    async fn write(mut self, _req: &mut Request, _depot: &mut Depot, res: &mut Response) {
        match self {
            Self::Sqlx(ref e) => error!("{:?}", e),
            Self::Internal(ref e) => error!("{:?}", e),
            _ => (),
        }

        res.status_code(self.status_code());
        res.render(Json(ErrorResponse {
            message: self.to_string(),
        }));
    }
}

pub trait ResultExt<T> {
    fn map_constraint_err<F>(self, name: &str, map_err: F) -> Result<T, Error>
    where
        F: FnOnce(Box<dyn sqlx::error::DatabaseError>) -> Error;
}

impl<T, E> ResultExt<T> for Result<T, E>
where
    E: Into<Error>,
{
    fn map_constraint_err<F>(self, name: &str, map_err: F) -> Result<T, Error>
    where
        F: FnOnce(Box<dyn sqlx::error::DatabaseError>) -> Error,
    {
        self.map_err(|e| match e.into() {
            Error::Sqlx(sqlx::Error::Database(e))
                if e.message()
                    .ends_with(&format!(" constraint failed: {name}")) =>
            {
                map_err(e)
            }
            e => e,
        })
    }
}
