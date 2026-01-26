use salvo::{catcher::Catcher, prelude::*};

mod auth;
mod collection_files;
mod collections;
mod files;
mod me;
mod settings;

use crate::{
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
async fn catcher(_req: &Request, _res: &mut Response, ctrl: &mut FlowCtrl) {
    ctrl.skip_rest();
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

    let router = Router::new()
        .hoop(affix_state::inject(app_state))
        .hoop(rate_limit(120))
        .hoop(inject_auth)
        .push(public)
        .push(protected);

    Service::new(router)
        .hoop(Logger::new())
        .catcher(Catcher::default().hoop(catcher))
}
