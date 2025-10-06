alter table users add column created_at timestamp not null default now();
alter table users alter column id set default gen_random_uuid();
