use std::net::IpAddr;

use salvo::{
    Depot, Request,
    rate_limiter::{CelledQuota, MokaStore, RateIssuer, RateLimiter, SlidingGuard},
};

use crate::http::{client_ip::client_ip, state::AppState};

#[derive(Clone, Debug)]
pub struct IpKeyExtractor;

impl RateIssuer for IpKeyExtractor {
    type Key = IpAddr;

    async fn issue(&self, req: &mut Request, _depot: &Depot) -> Option<Self::Key> {
        client_ip(req)
    }
}

fn is_disabled(_req: &mut Request, depot: &Depot) -> bool {
    depot
        .get_typed::<AppState>()
        .is_ok_and(|state| !state.settings.enable_rate_limit)
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
    .skipper(is_disabled)
}
