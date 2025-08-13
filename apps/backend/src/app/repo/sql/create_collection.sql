insert into collections (user_id, name)
values ($1, $2)
returning *
