use salvo::oapi::ToSchema;
use serde::Serialize;

#[derive(Clone, Debug, Serialize, ToSchema)]
#[salvo(schema(name = Settings))]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub enable_account_creation: bool,
    pub max_file_size: usize,
}
