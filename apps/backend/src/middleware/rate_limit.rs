use std::net::IpAddr;

use salvo::{
    Depot, Request,
    rate_limiter::{CelledQuota, MokaStore, RateIssuer, RateLimiter, SlidingGuard},
};

#[derive(Clone, Debug)]
pub struct IpKeyExtractor;

impl RateIssuer for IpKeyExtractor {
    type Key = String;

    async fn issue(&self, req: &mut Request, _depot: &Depot) -> Option<Self::Key> {
        req.headers()
            .get("x-forwarded-for")
            .and_then(|hv| hv.to_str().ok())
            .and_then(|s| s.split(',').find_map(|s| s.trim().parse::<IpAddr>().ok()))
            .map(|s| s.to_string())
    }
}

pub fn rate_limit(
    limit_per_minute: usize,
) -> RateLimiter<
    SlidingGuard,
    MokaStore<<IpKeyExtractor as RateIssuer>::Key, SlidingGuard>,
    IpKeyExtractor,
    CelledQuota,
> {
    RateLimiter::new(
        SlidingGuard::new(),
        MokaStore::new(),
        IpKeyExtractor,
        CelledQuota::per_minute(limit_per_minute, 6),
    )
}
