use std::fmt;

use sqlx::Type;

use crate::domain::id;

const LENGTH: usize = 32;

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
