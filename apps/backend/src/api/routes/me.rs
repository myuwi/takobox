use axum::{Json, extract::State, response::IntoResponse};

use crate::{
    api::{error::Error, state::AppState},
    models::{session::Session, user::User},
};

pub async fn show(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
) -> Result<impl IntoResponse, Error> {
    let user = sqlx::query_as!(User, "select * from users where id = $1", session.user_id)
        .fetch_one(&pool)
        .await?;

    Ok(Json(user))
}
