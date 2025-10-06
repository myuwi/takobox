use axum::{body::Body, response::IntoResponse};
use governor::{clock::QuantaInstant, middleware::NoOpMiddleware};
use tower_governor::{
    GovernorError, GovernorLayer, governor::GovernorConfigBuilder,
    key_extractor::SmartIpKeyExtractor,
};

use crate::http::error::Error;

// TODO: Implement a custom key extractor with only "x-forwarded-for"
pub fn rate_limit(
    replenish_ms: u64,
    burst_size: u32,
) -> GovernorLayer<SmartIpKeyExtractor, NoOpMiddleware<QuantaInstant>, Body> {
    let governor_conf = GovernorConfigBuilder::default()
        .per_millisecond(replenish_ms)
        .burst_size(burst_size)
        .key_extractor(SmartIpKeyExtractor)
        .finish()
        .unwrap();

    GovernorLayer::new(governor_conf).error_handler(|e| {
        match e {
            GovernorError::TooManyRequests { wait_time, .. } => {
                Error::TooManyRequests(wait_time as usize)
            }
            e => Error::Internal(e.into()),
        }
        .into_response()
    })
}
