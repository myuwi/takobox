use std::panic::AssertUnwindSafe;

use futures_util::FutureExt;
use salvo::prelude::*;

use crate::http::error::Error;

#[handler]
pub async fn catch_panic(
    req: &mut Request,
    depot: &mut Depot,
    res: &mut Response,
    ctrl: &mut FlowCtrl,
) {
    if AssertUnwindSafe(ctrl.call_next(req, depot, res))
        .catch_unwind()
        .await
        .is_err()
    {
        // The panic hook has already logged the panic. Discard whatever the
        // handler set before panicking, such as headers and cookies.
        *res = Response::new();
        Error::from_status_code(StatusCode::INTERNAL_SERVER_ERROR)
            .write(req, depot, res)
            .await;
    }
}
