use axum::http::StatusCode;
use sqlx::PgPool;

mod common;
use common::create_test_app;

#[sqlx::test]
async fn root(pool: PgPool) {
    let app = create_test_app(pool);

    let response = app.get("/").await;
    assert_eq!(response.status_code(), StatusCode::OK);
}
