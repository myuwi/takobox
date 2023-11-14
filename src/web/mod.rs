mod auth;
mod error;
mod middleware;
mod partials;
mod routes;

pub use routes::routes;

pub const AUTH_TOKEN: &str = "AUTH-TOKEN";
