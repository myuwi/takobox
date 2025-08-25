use axum::{Json, extract::State, response::IntoResponse};

use crate::http::{auth::session::Session, error::Error, model::user::User, state::AppState};

pub async fn show(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
) -> Result<impl IntoResponse, Error> {
    let user = sqlx::query_as!(User, "select * from users where id = $1", session.user_id)
        .fetch_one(&pool)
        .await
        .map_err(|_| Error::Internal)?;

    Ok(Json(user))
}
