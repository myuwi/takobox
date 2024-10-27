use std::ops::Add;

use argon2::{
    password_hash::{rand_core::OsRng, SaltString},
    Argon2, PasswordHash, PasswordHasher, PasswordVerifier,
};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use tower_cookies::{cookie::SameSite, Cookie};
use uuid::Uuid;

use crate::model::auth::Claims;

use super::AUTH_TOKEN;

const EXP_DAYS: i64 = 30;

pub fn hash_password(password: &str) -> Result<String, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|v| v.to_string())
}

pub fn verify_password(
    password: &str,
    password_hash: &str,
) -> Result<(), argon2::password_hash::Error> {
    let parsed_hash = PasswordHash::new(password_hash)?;
    Argon2::default().verify_password(password.as_bytes(), &parsed_hash)
}

pub fn encode_jwt(claims: &Claims, secret: &str) -> Result<String, jsonwebtoken::errors::Error> {
    let encoding_key = EncodingKey::from_secret(secret.as_bytes());
    encode(&Header::default(), &claims, &encoding_key)
}

pub fn decode_jwt(token: &str, secret: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    let decoding_key = DecodingKey::from_secret(secret.as_bytes());
    let validation = Validation::default();
    let token_data = decode::<Claims>(token, &decoding_key, &validation)?;
    Ok(token_data.claims)
}

pub fn create_jwt(id: &Uuid, secret: &str) -> Result<String, jsonwebtoken::errors::Error> {
    let now = Utc::now();
    let expiration = now.add(Duration::days(EXP_DAYS));

    let claims = Claims {
        exp: expiration.timestamp() as usize,
        iat: now.timestamp() as usize,
        sub: id.to_owned(),
    };

    encode_jwt(&claims, secret)
}

pub fn create_auth_cookie<'a>(token: String) -> Cookie<'a> {
    Cookie::build(AUTH_TOKEN, token)
        .path("/")
        .same_site(SameSite::Strict)
        .http_only(true)
        .finish()
}
