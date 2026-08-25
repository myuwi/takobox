use salvo::oapi::ToSchema;
use serde::Serialize;

use crate::settings::Settings;

#[derive(Clone, Debug, Serialize, ToSchema)]
#[salvo(schema(name = Settings))]
#[serde(rename_all = "camelCase")]
pub struct SettingsResponse {
    pub enable_account_creation: bool,
    pub max_file_size: usize,
}

impl From<&Settings> for SettingsResponse {
    fn from(settings: &Settings) -> Self {
        Self {
            enable_account_creation: settings.enable_account_creation,
            max_file_size: settings.max_file_size,
        }
    }
}
