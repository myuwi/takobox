use axum_test::TestServer;
use sqlx::PgPool;

use takobox::app;

pub fn create_test_app(pool: PgPool) -> TestServer {
    let session_secret =
        "vnRV6MOgCcoSD+/qZw760MQEPW6Weh2U6OpOcZiSAXFLGwyYChDigaecyCYYi5Rz+7us+KYZTcptilG5"
            .to_string();
    let app = app(session_secret, pool);

    let mut server = TestServer::new(app).unwrap();
    server.add_header("x-forwarded-for", "0.0.0.0");
    server
}
