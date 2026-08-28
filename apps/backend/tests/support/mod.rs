#![allow(dead_code)]

use salvo::Service;
use sqlx::SqlitePool;
use takobox::{AppState, Directories, Settings, db, router};
use tempfile::TempDir;

pub struct TestApp {
    pub service: Service,
    pub state: AppState,
    pub pool: SqlitePool,
    _data_dir: TempDir,
}

impl TestApp {
    pub async fn new() -> Self {
        let data_dir = tempfile::tempdir().unwrap();
        let dirs = Directories::new(data_dir.path());
        dirs.create_all().await.unwrap();

        let database_path = dirs.data_dir().join("database.sqlite");
        let pool = db::init_pool(database_path.to_str().unwrap())
            .await
            .unwrap();
        let state = AppState::try_from(
            "test-session-secret".repeat(4),
            pool.clone(),
            dirs,
            Settings {
                enable_account_creation: true,
                max_file_size: 32_000_000,
            },
        )
        .unwrap();

        Self {
            service: router(state.clone()),
            state,
            pool,
            _data_dir: data_dir,
        }
    }
}
