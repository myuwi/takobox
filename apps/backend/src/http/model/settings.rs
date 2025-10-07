use std::env;

use anyhow::anyhow;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub enable_account_creation: bool,
    pub max_file_size: usize,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            enable_account_creation: false,
            max_file_size: 32_000_000,
        }
    }
}

fn parse_env<T>(key: &str, default: T) -> anyhow::Result<T>
where
    T: std::str::FromStr,
    <T as std::str::FromStr>::Err: std::fmt::Display,
{
    match env::var(key) {
        Ok(v) => v
            .parse()
            .map_err(|e| anyhow!("Unable to parse '{key}': {e}.")),
        Err(_) => Ok(default),
    }
}

impl Settings {
    pub fn from_env() -> anyhow::Result<Self> {
        let default = Settings::default();

        Ok(Self {
            enable_account_creation: parse_env(
                "TAKOBOX_ENABLE_ACCOUNT_CREATION",
                default.enable_account_creation,
            )?,
            max_file_size: parse_env("TAKOBOX_MAX_FILE_SIZE", default.max_file_size)?,
        })
    }
}
