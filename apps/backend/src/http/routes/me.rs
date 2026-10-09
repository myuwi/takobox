use salvo::prelude::*;

use crate::{
    db::{self, sessions::Session},
    http::{error::Error, response::UserResponse, state::AppState},
};

/// Get current user
///
/// Get information about the currently logged in user
#[endpoint(operation_id = "me.get", tags("Users"))]
pub async fn show(depot: &mut Depot, session: Session) -> Result<Json<UserResponse>, Error> {
    let AppState { pool, .. } = depot.get_typed::<AppState>().unwrap();

    let user = db::users::get_by_id(pool, session.user_id).await?;

    Ok(Json(user.into()))
}
