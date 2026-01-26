use salvo::{Listener, Server, conn::TcpListener, server::ServerHandle};
use tokio::signal::{
    self,
    unix::{SignalKind, signal},
};

mod env;

use env::Env;
use takobox::{AppState, Directories, db, models::settings::Settings, router};

fn init_tracing() {
    tracing_subscriber::fmt().init();
}

async fn shutdown_signal(handle: ServerHandle) {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("Failed to register CTRL+C handler");
    };
    let mut term = signal(SignalKind::terminate()).expect("Failed to register SIGTERM handler");
    let mut interrupt = signal(SignalKind::interrupt()).expect("Failed to register SIGINT handler");

    tokio::select! {
        _ = ctrl_c => {}
        _ = term.recv() => {},
        _ = interrupt.recv() => {},
    };

    handle.stop_graceful(None);
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    init_tracing();

    let env = Env::parse()?;

    let dirs = Directories::new(&env.data_dir);
    dirs.create_all().await?;

    let database_path = dirs.data_dir().join("database.sqlite");
    let pool = db::init_pool(database_path.to_str().unwrap()).await?;

    let settings = Settings {
        enable_account_creation: env.enable_account_creation,
        max_file_size: env.max_file_size,
    };

    let app_state = AppState::try_from(env.session_secret, pool, dirs, settings)?;
    let app = router(app_state);

    let server = Server::new(TcpListener::new("0.0.0.0:8000").bind().await);
    let handle = server.handle();

    tokio::spawn(shutdown_signal(handle));

    server.serve(app).await;

    Ok(())
}
