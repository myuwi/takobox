use askama::Template;
use axum::{extract::State, response::IntoResponse, Form};
use tower_cookies::Cookies;

use crate::{
    model::user::{User, UserAuth},
    state::AppState,
    web::{
        auth::{create_auth_cookie, create_jwt, verify_password},
        partials::{AuthErrors, AuthFields},
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
    State(AppState { config, pool }): State<AppState>,
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

    verify_password(&form_data.password, &user.password)
        .map_err(|_| AuthFields::with_password_error("Incorrect password"))?;

    let token = create_jwt(&user.id, &config.session_secret)
        .map_err(|_| AuthFields::with_username_error("Unable to start session"))?;

    let auth_cookie = create_auth_cookie(token);
    cookies.add(auth_cookie);

    Ok([("HX-Redirect", "/")])
}
