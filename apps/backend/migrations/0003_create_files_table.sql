create table files (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  name text not null,
  original text not null,
  size integer not null,
  created_at integer not null default (unixepoch())
) strict;
