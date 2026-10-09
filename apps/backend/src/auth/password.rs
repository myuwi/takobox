use std::fmt;

use argon2::{
    Argon2, PasswordHasher, PasswordVerifier,
    password_hash::{SaltString, rand_core::OsRng},
};
use sqlx::Type;

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
