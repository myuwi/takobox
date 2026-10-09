use std::fmt;

use sqlx::Type;
use time::{Duration, UtcDateTime};

use super::id;

const LENGTH: usize = 32;
const LIFETIME: Duration = Duration::days(30);

pub fn expires_at(start: UtcDateTime) -> UtcDateTime {
    start + LIFETIME
}

#[derive(Clone, PartialEq, Eq, Type)]
#[sqlx(transparent)]
pub struct SessionToken(String);

impl SessionToken {
    pub fn generate() -> Self {
        Self(id::generate(LENGTH))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl From<String> for SessionToken {
    fn from(token: String) -> Self {
        Self(token)
    }
}

impl fmt::Debug for SessionToken {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        f.write_str("SessionToken(****)")
    }
}
