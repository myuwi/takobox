use salvo::prelude::*;
use tracing::{Instrument, field};

use crate::http::client_ip::client_ip;

#[handler]
pub async fn request_span(
    req: &mut Request,
    depot: &mut Depot,
    res: &mut Response,
    ctrl: &mut FlowCtrl,
) {
    let span = tracing::info_span!(
        "request",
        request_id = field::Empty,
        client_ip = field::Empty,
        // Recorded once the session is resolved.
        user_id = field::Empty,
        method = %req.method(),
        path = %req.uri().path(),
    );
    if let Some(request_id) = req.header::<String>("x-request-id") {
        span.record("request_id", request_id);
    }
    if let Some(ip) = client_ip(req) {
        span.record("client_ip", field::display(ip));
    }

    ctrl.call_next(req, depot, res).instrument(span).await;
}
