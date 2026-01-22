use axum::{Json, extract::State, response::IntoResponse};

use crate::{
    error::Error,
    models::{session::Session, user::User},
    state::AppState,
};

pub async fn show(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
) -> Result<impl IntoResponse, Error> {
    let user = User::get_by_id(&pool, session.user_id).await?;

    Ok(Json(user))
}
