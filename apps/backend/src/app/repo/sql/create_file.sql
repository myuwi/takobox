insert into files (user_id, name, original, size)
values ($1, $2, $3, $4)
returning *
