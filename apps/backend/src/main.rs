use std::process::ExitCode;

use salvo::{Listener, Server, conn::TcpListener, server::ServerHandle};
use tokio::signal::{
    self,
    unix::{SignalKind, signal},
};
use tracing::{error, info};
use tracing_subscriber::{EnvFilter, filter::LevelFilter};

mod env;
mod session_secret;

use anyhow::Context;
use env::Env;
use takobox::{AppState, Directories, SessionSecret, Settings, db, router};

fn init_tracing() {
    let filter = EnvFilter::builder()
        .with_default_directive(LevelFilter::INFO.into())
        .from_env_lossy();

    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .json()
        .flatten_event(true)
        .with_current_span(true)
        .with_span_list(false)
        .init();

    // Log panics through tracing too
    std::panic::set_hook(Box::new(|info| {
        error!(panic = %info, "panicked");
    }));
}

async fn shutdown_signal(handle: ServerHandle) {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("Failed to register CTRL+C handler");
    };
    let mut term = signal(SignalKind::terminate()).expect("Failed to register SIGTERM handler");

    tokio::select! {
        _ = ctrl_c => {}
        _ = term.recv() => {},
    };

    handle.stop_graceful(None);
}

#[tokio::main]
async fn main() -> ExitCode {
    init_tracing();

    // Report through tracing, so a fatal error is logged like everything else.
    if let Err(err) = run().await {
        error!(error = ?err, "exiting due to an error");
        return ExitCode::FAILURE;
    }

    ExitCode::SUCCESS
}

async fn run() -> anyhow::Result<()> {
    let env = Env::parse()?;

    let dirs = Directories::new(&env.data_dir);
    dirs.create_all().await?;
    dirs.clear_tmp_dir().await?;

    let data_dir = tokio::fs::canonicalize(dirs.data_dir())
        .await
        .with_context(|| format!("failed to resolve {}", dirs.data_dir().display()))?;
    info!(data_dir = %data_dir.display(), "starting takobox");

    let database_path = dirs.data_dir().join("database.sqlite");
    let database_path = database_path
        .to_str()
        .context("data directory path must be valid UTF-8")?;
    let pool = db::init_pool(database_path)
        .await
        .with_context(|| format!("failed to set up the database at {database_path}"))?;

    let settings = Settings {
        enable_account_creation: env.enable_account_creation,
        max_file_size: env.max_file_size,
        enable_rate_limit: env.enable_rate_limit,
    };

    let session_secret = match env.session_secret {
        Some(secret) => {
            SessionSecret::try_from(secret.as_str()).context("invalid TAKOBOX_SESSION_SECRET")?
        }
        None => session_secret::load_or_create(&data_dir).await?,
    };

    let app_state = AppState::new(session_secret, pool, dirs, settings);
    let app = router(app_state);

    let acceptor = TcpListener::new("0.0.0.0:8000")
        .try_bind()
        .await
        .context("failed to listen on 0.0.0.0:8000")?;
    let server = Server::new(acceptor);
    let handle = server.handle();

    tokio::spawn(shutdown_signal(handle));

    server.serve(app).await;

    Ok(())
}
