delete from collections 
where id = $1 and user_id = $2
returning *
