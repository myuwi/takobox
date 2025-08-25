use figment::{Figment, providers::Env};
use serde::{Deserialize, Serialize, de::Error};

// TODO: use clap?
#[derive(Clone, Deserialize, Serialize)]
pub struct Config {
    pub database_url: String,
    pub session_secret: String,
}

impl Config {
    pub fn from_env() -> figment::Result<Self> {
        Figment::new()
            .merge(Env::prefixed("TAKOBOX_"))
            .extract()
            .and_then(Config::validate)
    }

    fn validate(self) -> figment::Result<Self> {
        if self.database_url.is_empty() {
            return Err(figment::Error::custom(
                "database_url cannot be empty".to_string(),
            ));
        }

        if self.session_secret.len() < 64 {
            return Err(figment::Error::custom(
                "session_secret must be at least 64 bytes".to_string(),
            ));
        }

        Ok(self)
    }
}
