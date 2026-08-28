mod support;

use salvo::{
    http::StatusCode,
    test::{ResponseExt, TestClient},
};
use serde_json::json;
use support::TestApp;

const CLIENT_IP: &str = "192.0.2.1";

#[tokio::test]
async fn oversized_uploads_are_rejected_with_the_api_error_response() {
    let app = TestApp::new().await;

    let response = TestClient::post("http://127.0.0.1/api/auth/register")
        .add_header("x-forwarded-for", CLIENT_IP, true)
        .json(&json!({ "username": "limit-user", "password": "limit-password" }))
        .send(&app.service)
        .await;
    assert_eq!(response.status_code, Some(StatusCode::CREATED));

    let cookie = response
        .headers()
        .get(salvo::http::header::SET_COOKIE)
        .unwrap()
        .to_str()
        .unwrap()
        .split(';')
        .next()
        .unwrap()
        .to_owned();

    let oversized = vec![0u8; app.state.settings.max_file_size + 1];

    let mut response = TestClient::post("http://127.0.0.1/api/files")
        .add_header("x-forwarded-for", CLIENT_IP, true)
        .add_header("cookie", cookie, true)
        .add_header("content-type", "application/octet-stream", true)
        .body(oversized)
        .send(&app.service)
        .await;

    assert_eq!(response.status_code, Some(StatusCode::PAYLOAD_TOO_LARGE));
    assert!(
        response
            .take_string()
            .await
            .unwrap()
            .contains("Uploaded file is too large.")
    );
}
