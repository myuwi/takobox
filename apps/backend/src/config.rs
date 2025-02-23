use figment::{providers::Env, Figment};
use serde::{de::Error, Deserialize, Serialize};

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
    pub fn load() -> figment::Result<Self> {
        Figment::new().merge(Env::prefixed("TAKOBOX_")).extract()
    }

    pub fn validate(&self) -> figment::Result<()> {
        if self.session_secret.is_empty() {
            return Err(figment::Error::custom(
                "session_secret cannot be empty".to_string(),
            ));
        }

        Ok(())
    }
}
