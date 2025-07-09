-- migrate:up
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamp not null default now(),
  expires_at timestamp not null
);

-- migrate:down
drop table sessions;
