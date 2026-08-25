use salvo::prelude::*;

use crate::http::{error::Error, response::SettingsResponse, state::AppState};

/// Get settings
///
/// Get settings for the Takobox instance
#[endpoint(operation_id = "settings.get", tags("Settings"), status_codes(200))]
pub async fn show(depot: &mut Depot) -> Result<Json<SettingsResponse>, Error> {
    let AppState { settings, .. } = depot.get_typed::<AppState>().unwrap();

    Ok(Json(settings.into()))
}
