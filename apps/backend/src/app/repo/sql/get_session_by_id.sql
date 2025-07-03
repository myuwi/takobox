select
  id,
  user_id,
  (extract(epoch from created_at))::bigint as created_at,
  (extract(epoch from expires_at))::bigint as expires_at
from sessions
where id = $1
  and expires_at > now()
