use figment::Figment;
use serde::Deserialize;

fn default_data_dir() -> String {
    "takobox_data".to_string()
}

fn default_enable_account_creation() -> bool {
    false
}

fn default_max_file_size() -> usize {
    32_000_000
}

#[derive(Debug, Clone, Deserialize)]
pub struct Env {
    pub database_url: String,

    pub session_secret: String,

    #[serde(default = "default_data_dir")]
    pub data_dir: String,

    #[serde(default = "default_enable_account_creation")]
    pub enable_account_creation: bool,

    #[serde(default = "default_max_file_size")]
    pub max_file_size: usize,
}

impl Env {
    pub fn parse() -> figment::Result<Env> {
        Figment::new()
            .merge(figment::providers::Env::prefixed("TAKOBOX_"))
            .extract()
    }
}
