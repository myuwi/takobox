use tokio::{
    net::TcpListener,
    signal::unix::{SignalKind, signal},
};
use tracing::debug;
use tracing_subscriber::EnvFilter;

mod env;

use env::Env;
use takobox::{AppState, Directories, db, models::settings::Settings, router};

fn init_tracing() {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| {
            format!(
                "{}=debug,tower_http=debug,axum::rejection=trace",
                env!("CARGO_CRATE_NAME")
            )
            .into()
        }))
        .init();
}

async fn shutdown_signal() {
    let mut term = signal(SignalKind::terminate()).expect("Failed to register SIGTERM handler");
    let mut interrupt = signal(SignalKind::interrupt()).expect("Failed to register SIGINT handler");

    tokio::select! {
        _ = term.recv() => {},
        _ = interrupt.recv() => {},
    };

    debug!("Shutting down gracefully...");
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    init_tracing();

    let env = Env::parse()?;

    let pool = db::init_pool(&env.database_url).await?;
    let dirs = Directories::new(&env.data_dir);
    dirs.create_all().await?;

    let settings = Settings {
        enable_account_creation: env.enable_account_creation,
        max_file_size: env.max_file_size,
    };

    let app_state = AppState::try_from(env.session_secret, pool, dirs, settings)?;
    let app = router(app_state);

    let listener = TcpListener::bind("0.0.0.0:8000").await?;
    debug!("Listening on {}", listener.local_addr()?);
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;
    Ok(())
}
