create table collections (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  name text not null,
  created_at integer not null default (unixepoch()),
  unique (user_id, name)
) strict;
