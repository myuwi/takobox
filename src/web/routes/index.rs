use askama::Template;
use axum::response::IntoResponse;

use crate::model::user::User;

#[derive(Template)]
#[template(path = "index.html")]
pub struct Index {
    pub user: Option<User>,
}

pub async fn get(user: Option<User>) -> impl IntoResponse {
    Index { user }
}
