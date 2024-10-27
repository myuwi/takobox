use figment::{providers::Env, Figment};
use serde::{Deserialize, Serialize};

use crate::error::{Error, Result};

#[derive(Clone, Deserialize, Serialize)]
#[serde(default)]
pub struct Config {
    pub db_path: String,
    pub session_secret: String,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            db_path: "database.sqlite".to_string(),
            session_secret: "".to_string(),
        }
    }
}

impl Config {
    pub fn load() -> Result<Self> {
        Figment::new()
            .merge(Env::prefixed("TAKOBOX_"))
            .extract()
            .map_err(Error::Figment)
    }

    pub fn validate(&self) -> Result<()> {
        if self.session_secret.is_empty() {
            return Err(Error::Config("session_secret cannot be empty".to_string()));
        }

        Ok(())
    }
}
