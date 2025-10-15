create table sessions (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  created_at integer not null default (unixepoch()),
  expires_at integer not null
) strict;
