-- migrate:up
create table files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  original text not null,
  size bigint not null,
  created_at timestamp not null default now()
);

-- migrate:down
drop table files;
