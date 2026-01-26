use salvo::prelude::*;

use crate::{models::settings::Settings, state::AppState};

#[handler]
pub async fn show(depot: &mut Depot) -> Result<Json<Settings>, StatusError> {
    let AppState { settings, .. } = depot.obtain::<AppState>().unwrap();

    Ok(Json(settings.clone()))
}
