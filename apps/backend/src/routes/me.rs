use salvo::prelude::*;

use crate::{
    error::Error,
    models::{session::Session, user::User},
    state::AppState,
};

#[handler]
pub async fn show(depot: &mut Depot, session: Session) -> Result<Json<User>, Error> {
    let AppState { pool, .. } = depot.obtain::<AppState>().unwrap();

    let user = User::get_by_id(pool, session.user_id).await?;

    Ok(Json(user))
}
