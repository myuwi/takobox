use argon2::{
    Argon2, PasswordHash, PasswordHasher, PasswordVerifier,
    password_hash::{SaltString, rand_core::OsRng},
};

pub struct Password(String);

impl std::fmt::Debug for Password {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        f.write_str("Password(****)")
    }
}

impl AsRef<str> for Password {
    fn as_ref(&self) -> &str {
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

pub fn hash_password(password: &Password) -> Result<String, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(password.as_ref().as_bytes(), &salt)
        .map(|v| v.to_string())
}

pub fn verify_password(
    password: &str,
    password_hash: &str,
) -> Result<(), argon2::password_hash::Error> {
    let parsed_hash = PasswordHash::new(password_hash)?;
    Argon2::default().verify_password(password.as_bytes(), &parsed_hash)
}
