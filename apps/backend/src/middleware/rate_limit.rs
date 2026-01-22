use std::net::IpAddr;

use axum::{body::Body, response::IntoResponse};
use governor::{clock::QuantaInstant, middleware::NoOpMiddleware};
use tower_governor::{
    GovernorError, GovernorLayer, governor::GovernorConfigBuilder, key_extractor::KeyExtractor,
};

use crate::error::Error;

#[derive(Clone, Debug)]
pub struct IpKeyExtractor;

impl KeyExtractor for IpKeyExtractor {
    type Key = IpAddr;

    fn extract<T>(&self, req: &axum::http::Request<T>) -> Result<Self::Key, GovernorError> {
        req.headers()
            .get("x-forwarded-for")
            .and_then(|hv| hv.to_str().ok())
            .and_then(|s| s.split(',').find_map(|s| s.trim().parse::<IpAddr>().ok()))
            .ok_or(GovernorError::UnableToExtractKey)
    }
}

pub fn rate_limit(
    replenish_ms: u64,
    burst_size: u32,
) -> GovernorLayer<IpKeyExtractor, NoOpMiddleware<QuantaInstant>, Body> {
    let governor_conf = GovernorConfigBuilder::default()
        .per_millisecond(replenish_ms)
        .burst_size(burst_size)
        .key_extractor(IpKeyExtractor)
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
