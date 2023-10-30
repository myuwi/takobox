use askama::Template;
use axum::{extract::State, response::IntoResponse, Form};
use sqlx::SqlitePool;
use tower_cookies::{Cookie, Cookies};
use uuid::Uuid;

use crate::{model::user::UserAuth, web::AUTH_TOKEN};

#[derive(Default)]
struct Errors {
    username: Option<String>,
    password: Option<String>,
}

#[derive(Template, Default)]
#[template(path = "auth-fields.html")]
pub struct AuthFields {
    errors: Errors,
}

impl AuthFields {
    fn with_username_error(msg: impl Into<String>) -> Self {
        Self {
            errors: Errors {
                username: Some(msg.into()),
                ..Default::default()
            },
        }
    }

    fn with_password_error(msg: impl Into<String>) -> Self {
        Self {
            errors: Errors {
                password: Some(msg.into()),
                ..Default::default()
            },
        }
    }
}

#[derive(Template, Default)]
#[template(path = "register.html")]
struct Register {
    errors: Errors,
}

pub async fn get() -> impl IntoResponse {
    Register::default()
}

pub async fn post(
    State(pool): State<SqlitePool>,
    cookies: Cookies,
    Form(form_data): Form<UserAuth>,
) -> Result<impl IntoResponse, AuthFields> {
    // TODO: Better form validation
    if !(4..=32).contains(&form_data.username.len()) {
        return Err(AuthFields::with_username_error(
            "Username must be between 4 and 32 characters",
        ));
    }

    if !(6..=64).contains(&form_data.password.len()) {
        return Err(AuthFields::with_password_error(
            "Password must be between 6 and 64 characters",
        ));
    }

    let res = sqlx::query("INSERT INTO users (id, username, password) VALUES ($1, $2, $3)")
        .bind(Uuid::new_v4())
        .bind(&form_data.username)
        // TODO: Don't insert as plain text
        .bind(&form_data.password)
        .execute(&pool)
        .await;

    res.map_err(|err| {
        // TODO: Better error messages
        match err
            .as_database_error()
            .map(|e| e.code().unwrap_or_default())
            .unwrap_or_default()
            .to_string()
            .as_str()
        {
            "2067" => AuthFields::with_username_error("Username is already taken"),
            _ => AuthFields::with_username_error("Unable to create account"),
        }
    })?;

    // TODO: Generate a real token
    let auth_cookie = Cookie::build(AUTH_TOKEN, format!("{}.fake.token", &form_data.username))
        .http_only(true)
        .finish();
    cookies.add(auth_cookie);

    Ok([("HX-Redirect", "/")])
}
