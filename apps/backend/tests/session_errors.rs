mod support;

use salvo::{
    http::{StatusCode, header::SET_COOKIE},
    test::TestClient,
};
use serde_json::json;
use support::TestApp;

const CLIENT_IP: &str = "192.0.2.1";

async fn register_and_get_session_cookie(app: &TestApp) -> String {
    let response = TestClient::post("http://127.0.0.1/api/auth/register")
        .add_header("x-forwarded-for", CLIENT_IP, true)
        .json(&json!({
            "username": "session-user",
            "password": "session-password",
        }))
        .send(&app.service)
        .await;

    assert_eq!(response.status_code, Some(StatusCode::CREATED));

    response
        .headers()
        .get(SET_COOKIE)
        .expect("register should set a session cookie")
        .to_str()
        .unwrap()
        .split(';')
        .next()
        .unwrap()
        .to_owned()
}

#[tokio::test]
async fn a_valid_session_resolves() {
    let app = TestApp::new().await;
    let cookie = register_and_get_session_cookie(&app).await;

    let response = TestClient::get("http://127.0.0.1/api/me")
        .add_header("x-forwarded-for", CLIENT_IP, true)
        .add_header("cookie", cookie, true)
        .send(&app.service)
        .await;

    assert_eq!(response.status_code, Some(StatusCode::OK));
}

#[tokio::test]
async fn a_missing_session_is_unauthorized() {
    let app = TestApp::new().await;

    let response = TestClient::get("http://127.0.0.1/api/me")
        .add_header("x-forwarded-for", CLIENT_IP, true)
        .send(&app.service)
        .await;

    assert_eq!(response.status_code, Some(StatusCode::UNAUTHORIZED));
}

#[tokio::test]
async fn a_database_failure_is_not_reported_as_unauthorized() {
    let app = TestApp::new().await;
    let cookie = register_and_get_session_cookie(&app).await;

    app.pool.close().await;

    let response = TestClient::get("http://127.0.0.1/api/me")
        .add_header("x-forwarded-for", CLIENT_IP, true)
        .add_header("cookie", cookie, true)
        .send(&app.service)
        .await;

    assert_eq!(
        response.status_code,
        Some(StatusCode::INTERNAL_SERVER_ERROR)
    );
}
