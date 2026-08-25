use salvo::prelude::*;

use crate::{
    http::{error::Error, response::UserResponse, state::AppState},
    models::{session::Session, user::User},
};

/// Get current user
///
/// Get information about the currently logged in user
#[endpoint(operation_id = "me.get", tags("Users"), status_codes(200))]
pub async fn show(depot: &mut Depot, session: Session) -> Result<Json<UserResponse>, Error> {
    let AppState { pool, .. } = depot.get_typed::<AppState>().unwrap();

    let user = User::get_by_id(pool, session.user_id).await?;

    Ok(Json(user.into()))
}
