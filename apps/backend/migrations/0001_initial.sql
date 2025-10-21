create table users (
  id integer primary key autoincrement,
  public_id text not null unique,
  username text not null unique check (username = lower(username)),
  password text not null,
  created_at integer not null default (unixepoch())
) strict;

create table sessions (
  id integer primary key autoincrement,
  public_id text not null unique,
  user_id integer not null references users(id) on delete cascade,
  created_at integer not null default (unixepoch()),
  expires_at integer not null
) strict;

create table files (
  id integer primary key autoincrement,
  public_id text not null unique,
  user_id integer not null references users(id) on delete cascade,
  name text not null,
  original text not null,
  size integer not null,
  created_at integer not null default (unixepoch())
) strict;

create table collections (
  id integer primary key autoincrement,
  public_id text not null unique,
  user_id integer not null references users(id) on delete cascade,
  name text not null,
  created_at integer not null default (unixepoch()),
  unique (user_id, name)
) strict;

create table collection_files (
  collection_id integer not null references collections(id) on delete cascade,
  file_id integer not null references files(id) on delete cascade,
  primary key (collection_id, file_id)
) strict;
