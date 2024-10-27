use askama::Template;

#[derive(Default)]
pub struct AuthErrors {
    pub username: Option<String>,
    pub password: Option<String>,
}

#[derive(Template, Default)]
#[template(path = "partials/auth-fields.html")]
pub struct AuthFields {
    pub errors: AuthErrors,
}

impl AuthFields {
    pub fn with_username_error(msg: impl Into<String>) -> Self {
        Self {
            errors: AuthErrors {
                username: Some(msg.into()),
                ..Default::default()
            },
        }
    }

    pub fn with_password_error(msg: impl Into<String>) -> Self {
        Self {
            errors: AuthErrors {
                password: Some(msg.into()),
                ..Default::default()
            },
        }
    }
}
