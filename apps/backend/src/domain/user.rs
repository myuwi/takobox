use std::{fmt, sync::LazyLock};

use regex::Regex;
use salvo::oapi::ToSchema;
use serde::{Deserialize, Serialize};
use sqlx::Type;

use super::id;

/// The public id of a user.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, Type, ToSchema)]
#[salvo(schema(name = UserId))]
#[serde(transparent)]
#[sqlx(transparent)]
pub struct UserId(String);

impl UserId {
    pub fn generate(length: usize) -> Self {
        Self(id::generate(length))
    }
}

impl fmt::Display for UserId {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        f.write_str(&self.0)
    }
}

static VALID_USERNAME_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^[a-z0-9_-]+$").unwrap());

#[derive(Debug)]
pub struct Username(String);

impl Username {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<String> for Username {
    type Error = &'static str;

    fn try_from(s: String) -> Result<Self, Self::Error> {
        if !VALID_USERNAME_REGEX.is_match(&s) {
            return Err(
                "Username may only contain lowercase letters (a-z), numbers (0-9), underscores (_), and hyphens (-).",
            );
        }

        if !(4..=32).contains(&s.len()) {
            return Err("Username must be between 4 and 32 characters");
        }

        Ok(Self(s))
    }
}
