create table collection_files (
  collection_id text not null references collections(id) on delete cascade,
  file_id text not null references files(id) on delete cascade,
  primary key (collection_id, file_id)
) strict;
