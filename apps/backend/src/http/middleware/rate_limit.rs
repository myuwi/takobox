use std::net::IpAddr;

use salvo::{
    Depot, Request,
    rate_limiter::{CelledQuota, MokaStore, RateIssuer, RateLimiter, SlidingGuard},
};

use crate::http::state::AppState;

/// Trusts `X-Forwarded-For` only from private addresses, where the reverse proxy lives.
#[derive(Clone, Debug)]
pub struct IpKeyExtractor;

impl RateIssuer for IpKeyExtractor {
    type Key = IpAddr;

    async fn issue(&self, req: &mut Request, _depot: &Depot) -> Option<Self::Key> {
        let remote_ip = req.remote_addr().ip();
        if remote_ip.is_some_and(|ip| !is_private(ip)) {
            return remote_ip;
        }

        forwarded_ip(req).or(remote_ip)
    }
}

/// The rightmost entry is the one the proxy appended; the rest came from the client.
fn forwarded_ip(req: &Request) -> Option<IpAddr> {
    req.headers()
        .get("x-forwarded-for")?
        .to_str()
        .ok()?
        .rsplit(',')
        .next()?
        .trim()
        .parse()
        .ok()
}

/// Matches Caddy's `private_ranges`.
fn is_private(ip: IpAddr) -> bool {
    match ip.to_canonical() {
        IpAddr::V4(ip) => ip.is_private() || ip.is_loopback(),
        IpAddr::V6(ip) => ip.is_loopback() || ip.is_unique_local(),
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

#[cfg(test)]
mod tests {
    use salvo::{conn::SocketAddr, http::header::HeaderValue};

    use super::*;

    async fn issue(remote_addr: &str, forwarded_for: Option<&'static str>) -> Option<IpAddr> {
        let mut req = Request::new();
        *req.remote_addr_mut() =
            SocketAddr::from(remote_addr.parse::<std::net::SocketAddr>().unwrap());
        if let Some(forwarded_for) = forwarded_for {
            req.headers_mut()
                .insert("x-forwarded-for", HeaderValue::from_static(forwarded_for));
        }

        IpKeyExtractor.issue(&mut req, &Depot::new()).await
    }

    #[tokio::test]
    async fn ignores_entries_prepended_by_the_client() {
        let issued = issue("172.18.0.2:1", Some("1.2.3.4, 203.0.113.7")).await;

        assert_eq!(issued, "203.0.113.7".parse().ok());
    }

    #[tokio::test]
    async fn ignores_the_header_from_public_connections() {
        let issued = issue("203.0.113.7:1", Some("1.2.3.4")).await;

        assert_eq!(issued, "203.0.113.7".parse().ok());
    }

    #[tokio::test]
    async fn falls_back_to_the_connection_without_the_header() {
        let issued = issue("172.18.0.2:1", None).await;

        assert_eq!(issued, "172.18.0.2".parse().ok());
    }

    #[tokio::test]
    async fn falls_back_to_the_connection_on_an_unparsable_header() {
        let issued = issue("172.18.0.2:1", Some("1.2.3.4, unknown")).await;

        assert_eq!(issued, "172.18.0.2".parse().ok());
    }

    #[tokio::test]
    async fn trusts_proxies_over_ipv6() {
        let issued = issue("[fd00::2]:1", Some("2001:db8::7")).await;

        assert_eq!(issued, "2001:db8::7".parse().ok());
    }
}
