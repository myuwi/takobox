create table users (
  id text primary key,
  username text not null unique check (username = lower(username)),
  password text not null,
  created_at integer not null default (unixepoch())
) strict;
