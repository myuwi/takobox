use std::{fmt, sync::LazyLock};

use argon2::{
    Argon2, PasswordHasher, PasswordVerifier,
    password_hash::{SaltString, rand_core::OsRng},
};
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

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Type, ToSchema)]
#[salvo(schema(name = Role))]
#[serde(rename_all = "lowercase")]
#[sqlx(rename_all = "lowercase")]
pub enum Role {
    User,
    Admin,
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

pub struct Password(String);

impl fmt::Debug for Password {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        f.write_str("Password(****)")
    }
}

impl Password {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<String> for Password {
    type Error = &'static str;

    fn try_from(s: String) -> Result<Self, Self::Error> {
        if !(6..=64).contains(&s.len()) {
            return Err("Password must be between 6 and 64 characters");
        }

        Ok(Self(s))
    }
}

#[derive(Clone, Type)]
#[sqlx(transparent)]
pub struct PasswordHash(String);

impl fmt::Debug for PasswordHash {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        f.write_str("PasswordHash(****)")
    }
}

pub fn hash_password(password: &Password) -> Result<PasswordHash, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(password.as_str().as_bytes(), &salt)
        .map(|hash| PasswordHash(hash.to_string()))
}

pub fn verify_password(
    password: &str,
    password_hash: &PasswordHash,
) -> Result<(), argon2::password_hash::Error> {
    let parsed_hash = argon2::PasswordHash::new(&password_hash.0)?;
    Argon2::default().verify_password(password.as_bytes(), &parsed_hash)
}
