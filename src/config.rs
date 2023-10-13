use figment::{providers::Env, Figment};
use serde::{Deserialize, Serialize};

use crate::error::{Error, Result};

#[derive(Clone, Deserialize, Serialize)]
#[serde(default)]
pub struct Config {
    pub db_path: String,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            db_path: "database.sqlite".to_string(),
        }
    }
}

impl Config {
    pub fn new() -> Result<Self> {
        Figment::new()
            .merge(Env::prefixed("TAKOBOX_"))
            .extract()
            .map_err(Error::Config)
    }
}
