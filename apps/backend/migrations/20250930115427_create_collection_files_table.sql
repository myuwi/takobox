create table collection_files (
  collection_id uuid not null references collections(id) on delete cascade,
  file_id uuid not null references files(id) on delete cascade,
  primary key (collection_id, file_id)
);
