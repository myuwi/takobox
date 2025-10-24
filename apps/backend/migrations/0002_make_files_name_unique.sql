pragma foreign_keys=off;

create table new_files (
  id integer primary key autoincrement,
  public_id text not null unique,
  user_id integer not null references users(id) on delete cascade,
  name text not null unique,
  original text not null,
  size integer not null,
  created_at integer not null default (unixepoch())
) strict;

insert into new_files select * from files;
drop table files;
alter table new_files rename to files;

pragma foreign_key_check;
pragma foreign_keys=on;
