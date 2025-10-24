use axum::{Json, extract::State, response::IntoResponse};

use crate::{
    api::{error::Error, state::AppState},
    models::{session::Session, user::User},
};

pub async fn show(
    State(AppState { pool, .. }): State<AppState>,
    session: Session,
) -> Result<impl IntoResponse, Error> {
    let user = User::get_by_id(&pool, session.user_id).await?;

    Ok(Json(user))
}
