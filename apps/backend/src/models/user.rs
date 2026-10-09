use std::sync::LazyLock;

use regex::Regex;

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
