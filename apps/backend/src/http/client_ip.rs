use std::net::IpAddr;

use salvo::Request;

/// The client's address, trusting `X-Forwarded-For` only from private addresses, where the
/// reverse proxy lives.
pub fn client_ip(req: &Request) -> Option<IpAddr> {
    let remote_ip = req.remote_addr().ip();
    if remote_ip.is_some_and(|ip| !is_private(ip)) {
        return remote_ip;
    }

    forwarded_ip(req).or(remote_ip)
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

#[cfg(test)]
mod tests {
    use salvo::{conn::SocketAddr, http::header::HeaderValue};

    use super::*;

    fn resolve(remote_addr: &str, forwarded_for: Option<&'static str>) -> Option<IpAddr> {
        let mut req = Request::new();
        *req.remote_addr_mut() =
            SocketAddr::from(remote_addr.parse::<std::net::SocketAddr>().unwrap());
        if let Some(forwarded_for) = forwarded_for {
            req.headers_mut()
                .insert("x-forwarded-for", HeaderValue::from_static(forwarded_for));
        }

        client_ip(&req)
    }

    #[test]
    fn ignores_entries_prepended_by_the_client() {
        let resolved = resolve("172.18.0.2:1", Some("1.2.3.4, 203.0.113.7"));

        assert_eq!(resolved, "203.0.113.7".parse().ok());
    }

    #[test]
    fn ignores_the_header_from_public_connections() {
        let resolved = resolve("203.0.113.7:1", Some("1.2.3.4"));

        assert_eq!(resolved, "203.0.113.7".parse().ok());
    }

    #[test]
    fn falls_back_to_the_connection_without_the_header() {
        let resolved = resolve("172.18.0.2:1", None);

        assert_eq!(resolved, "172.18.0.2".parse().ok());
    }

    #[test]
    fn falls_back_to_the_connection_on_an_unparsable_header() {
        let resolved = resolve("172.18.0.2:1", Some("1.2.3.4, unknown"));

        assert_eq!(resolved, "172.18.0.2".parse().ok());
    }

    #[test]
    fn trusts_proxies_over_ipv6() {
        let resolved = resolve("[fd00::2]:1", Some("2001:db8::7"));

        assert_eq!(resolved, "2001:db8::7".parse().ok());
    }
}
