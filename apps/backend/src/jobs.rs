use std::time::Duration;

use sqlx::SqlitePool;
use tokio_util::sync::CancellationToken;
use tracing::{error, info};

use crate::db;

/// Deletes expired sessions every hour.
pub async fn delete_expired_sessions(pool: SqlitePool, cancel: CancellationToken) {
    let mut interval = tokio::time::interval(Duration::from_hours(1));

    loop {
        tokio::select! {
            biased;
            _ = cancel.cancelled() => return,
            _ = interval.tick() => (),
        }

        match db::sessions::delete_expired(&pool).await {
            Ok(0) => (),
            Ok(count) => info!(count, "deleted expired sessions"),
            Err(err) => error!(error = ?err, "failed to delete expired sessions"),
        }
    }
}
