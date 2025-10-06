create table users (
  id uuid primary key,
  username text not null unique check (username = lower(username)),
  password text not null
);
