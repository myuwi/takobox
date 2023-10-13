use figment::{providers::Env, Error, Figment};
use serde::{Deserialize, Serialize};

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
    pub fn new() -> Result<Self, Error> {
        Figment::new().merge(Env::prefixed("TAKOBOX_")).extract()
    }
}
