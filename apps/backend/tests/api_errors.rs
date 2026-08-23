mod support;

use salvo::{
    Response,
    http::{StatusCode, header::CONTENT_TYPE},
    test::{RequestBuilder, ResponseExt, TestClient},
};
use serde::Deserialize;
use serde_json::json;
use support::TestApp;

const CLIENT_IP: &str = "192.0.2.1";

#[derive(Debug, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
struct ErrorResponse {
    message: String,
}

async fn assert_error_response(
    mut response: Response,
    expected_status: StatusCode,
    expected_message: &str,
) {
    assert_eq!(response.status_code, Some(expected_status));
    assert_eq!(
        response.headers().get(CONTENT_TYPE).unwrap(),
        "application/json; charset=utf-8",
    );
    assert_eq!(
        response.take_json::<ErrorResponse>().await.unwrap(),
        ErrorResponse {
            message: expected_message.to_owned(),
        },
    );
}

fn login_request() -> RequestBuilder {
    TestClient::post("http://127.0.0.1/api/auth/login")
        .add_header("x-forwarded-for", CLIENT_IP, true)
        .json(&json!({
            "username": "missing-user",
            "password": "invalid-password",
        }))
}

#[tokio::test]
async fn application_errors_return_the_api_error_response() {
    let app = TestApp::new().await;

    let response = login_request().send(&app.service).await;

    assert_error_response(
        response,
        StatusCode::UNAUTHORIZED,
        "Invalid username or password",
    )
    .await;
}

#[tokio::test]
async fn unknown_routes_return_the_api_error_response() {
    let app = TestApp::new().await;

    let response = TestClient::get("http://127.0.0.1/api/missing")
        .add_header("x-forwarded-for", CLIENT_IP, true)
        .send(&app.service)
        .await;

    assert_error_response(response, StatusCode::NOT_FOUND, "Not Found").await;
}

#[tokio::test]
async fn missing_rate_limit_identifiers_return_the_api_error_response() {
    let app = TestApp::new().await;

    let response = TestClient::get("http://127.0.0.1/api/settings")
        .send(&app.service)
        .await;

    assert_error_response(response, StatusCode::BAD_REQUEST, "Bad Request").await;
}

#[tokio::test]
async fn rate_limited_requests_return_the_api_error_response() {
    let app = TestApp::new().await;

    for _ in 0..6 {
        let response = login_request().send(&app.service).await;
        assert_eq!(response.status_code, Some(StatusCode::UNAUTHORIZED));
    }

    let response = login_request().send(&app.service).await;

    assert_error_response(
        response,
        StatusCode::TOO_MANY_REQUESTS,
        "Too many requests. Try again later.",
    )
    .await;
}
