use anyhow::anyhow;
use salvo::http::cookie::Key;
use sqlx::SqlitePool;

use crate::{directories::Directories, settings::Settings};

pub struct SessionSecret(Key);

impl TryFrom<&str> for SessionSecret {
    type Error = anyhow::Error;

    fn try_from(secret: &str) -> anyhow::Result<Self> {
        let key = Key::try_from(secret.as_bytes())
            .map_err(|_| anyhow!("session secret must be at least 64 bytes"))?;
        Ok(Self(key))
    }
}

#[derive(Clone)]
pub struct AppState {
    pub session_secret: Key,
    pub pool: SqlitePool,
    pub dirs: Directories,
    pub settings: Settings,
}

impl AppState {
    pub fn new(
        session_secret: SessionSecret,
        pool: SqlitePool,
        dirs: Directories,
        settings: Settings,
    ) -> Self {
        Self {
            session_secret: session_secret.0,
            pool,
            dirs,
            settings,
        }
    }
}
