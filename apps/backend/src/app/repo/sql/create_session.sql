insert into sessions (user_id, expires_at)
values ($1, now() + make_interval(secs => $2::integer))
returning *
