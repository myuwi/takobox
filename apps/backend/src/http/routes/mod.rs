use salvo::{
    catcher::Catcher,
    oapi::{Info, Server},
    prelude::*,
};

mod auth;
mod collection_files;
mod collections;
mod files;
mod me;
mod settings;

use crate::http::{
    error::Error,
    middleware::{
        auth::{inject_auth, require_auth},
        rate_limit::rate_limit,
    },
    state::AppState,
};

#[handler]
async fn root() -> &'static str {
    "Hello Takobox API!"
}

#[handler]
async fn catcher(req: &mut Request, depot: &mut Depot, res: &mut Response) {
    let status = res.status_code.unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
    Error::from_status_code(status).write(req, depot, res).await;
}

pub fn router(app_state: AppState) -> Service {
    let public = Router::new()
        .get(root)
        .push(Router::with_path("settings").get(settings::show))
        .push(Router::with_path("auth").push(auth::routes()));

    let protected = Router::new()
        .hoop(require_auth)
        .push(Router::with_path("me").get(me::show))
        .push(Router::with_path("files").push(files::routes(&app_state)))
        .push(Router::with_path("collections").push(collections::routes()));

    let api_router = Router::new()
        .hoop(affix_state::inject(app_state))
        .hoop(rate_limit(120))
        .hoop(inject_auth)
        .push(public)
        .push(protected);

    let mut doc = OpenApi::with_info(
        Info::new("Takobox API Reference", "0.1.0").description("The Takobox API Reference"),
    )
    .merge_router(&api_router);
    doc.servers.insert(Server::new("/api"));

    // Remove StatusError from the schemas as it is not used
    doc.components
        .schemas
        .remove("salvo_core.http.errors.status_error.StatusError");

    let router = Router::new()
        .push(Router::with_path("api").push(api_router))
        .push(
            Router::new()
                .push(doc.into_router("/docs/openapi.json"))
                .push(
                    Scalar::new("/docs/openapi.json")
                        .title("Takobox API Reference")
                        .into_router("/docs"),
                ),
        );

    Service::new(router)
        .hoop(Logger::new())
        .catcher(Catcher::new(catcher))
}
