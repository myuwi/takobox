insert into sessions (user_id, expires_at)
values ($1, now() + make_interval(secs => $2::integer))
returning
  id,
  user_id,
  (extract(epoch from created_at))::bigint as created_at,
  (extract(epoch from expires_at))::bigint as expires_at
