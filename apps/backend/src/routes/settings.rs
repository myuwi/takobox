use salvo::prelude::*;

use crate::{error::Error, models::settings::Settings, state::AppState};

/// Get settings
///
/// Get settings for the Takobox instance
#[endpoint(operation_id = "settings.get", tags("Settings"), status_codes(200))]
pub async fn show(depot: &mut Depot) -> Result<Json<Settings>, Error> {
    let AppState { settings, .. } = depot.obtain::<AppState>().unwrap();

    Ok(Json(settings.clone()))
}
