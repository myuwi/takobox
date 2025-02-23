use axum::{extract::State, routing::post, Json, Router};
use serde::Serialize;
use uuid::Uuid;

use crate::{
    auth::{
        jwt::create_jwt,
        password::{hash_password, verify_password},
    },
    model::user::{User, UserAuth},
    state::AppState,
};

#[derive(Serialize)]
pub struct LoginResponse {
    pub token: String,
}

pub async fn login(
    State(AppState { config, pool }): State<AppState>,
    Json(body): Json<UserAuth>,
) -> Result<Json<LoginResponse>, String> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE username = $1")
        .bind(&body.username)
        .fetch_one(&pool)
        .await;

    let Ok(user) = user else {
        return Err("Couldn't find a user with this username".to_string());
    };

    verify_password(&body.password, &user.password)
        .map_err(|_| "Incorrect password".to_string())?;

    let token = create_jwt(&user.id, &config.session_secret)
        .map_err(|_| "Unable to start session".to_string())?;

    Ok(Json(LoginResponse { token }))
}

pub async fn register(
    State(AppState { config, pool }): State<AppState>,
    Json(body): Json<UserAuth>,
) -> Result<Json<LoginResponse>, String> {
    if !(4..=32).contains(&body.username.len()) {
        return Err("Username must be between 4 and 32 characters".to_string());
    }

    if !(6..=64).contains(&body.password.len()) {
        return Err("Password must be between 6 and 64 characters".to_string());
    }

    let password_hash =
        hash_password(&body.password).map_err(|_| "Invalid password".to_string())?;

    let uuid = Uuid::new_v4();

    sqlx::query("INSERT INTO users (id, username, password) VALUES ($1, $2, $3)")
        .bind(uuid)
        .bind(&body.username)
        .bind(&password_hash)
        .execute(&pool)
        .await
        .map_err(|err| {
            // TODO: Better error messages
            match err.as_database_error().map(|e| e.kind()) {
                Some(sqlx::error::ErrorKind::UniqueViolation) => "Username is already taken",
                _ => "Unable to create account",
            }
        })?;

    let token = create_jwt(&uuid, &config.session_secret)
        .map_err(|_| "Unable to start session".to_string())?;

    Ok(Json(LoginResponse { token }))
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/login", post(login))
        .route("/register", post(register))
}
