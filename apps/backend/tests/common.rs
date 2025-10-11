use axum_test::TestServer;
use sqlx::PgPool;
use takobox::{AppState, Directories, models::settings::Settings, router};

pub fn create_test_app(pool: PgPool) -> TestServer {
    let session_secret =
        "vnRV6MOgCcoSD+/qZw760MQEPW6Weh2U6OpOcZiSAXFLGwyYChDigaecyCYYi5Rz+7us+KYZTcptilG5"
            .to_string();

    let tmp_dirs = Directories::new("/tmp/takobox_data");
    let settings = Settings {
        enable_account_creation: false,
        max_file_size: 0,
    };
    let app_state = AppState::try_from(session_secret, pool, tmp_dirs, settings).unwrap();
    let app = router(app_state);

    let mut server = TestServer::new(app).unwrap();
    server.add_header("x-forwarded-for", "0.0.0.0");
    server
}
