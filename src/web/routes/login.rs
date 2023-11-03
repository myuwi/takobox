use askama::Template;
use axum::{extract::State, response::IntoResponse, Form};
use sqlx::SqlitePool;
use tower_cookies::{cookie::SameSite, Cookie, Cookies};

use crate::{
    model::user::{User, UserAuth},
    web::{
        partials::{AuthErrors, AuthFields},
        AUTH_TOKEN,
    },
};

#[derive(Template, Default)]
#[template(path = "login.html")]
pub struct Login {
    pub errors: AuthErrors,
}

pub async fn get() -> impl IntoResponse {
    Login::default()
}

pub async fn post(
    State(pool): State<SqlitePool>,
    cookies: Cookies,
    Form(form_data): Form<UserAuth>,
) -> Result<impl IntoResponse, AuthFields> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE username = $1")
        .bind(&form_data.username)
        .fetch_one(&pool)
        .await;

    let Ok(user) = user else {
        return Err(AuthFields::with_username_error(
            "Couldn't find a user with this username.",
        ));
    };

    if form_data.password != user.password {
        return Err(AuthFields::with_password_error("Incorrect password"));
    }

    // TODO: Generate a real token
    let auth_cookie = Cookie::build(AUTH_TOKEN, format!("{}.fake.token", &user.username))
        .same_site(SameSite::Strict)
        .http_only(true)
        .finish();
    cookies.add(auth_cookie);

    Ok([("HX-Redirect", "/")])
}
