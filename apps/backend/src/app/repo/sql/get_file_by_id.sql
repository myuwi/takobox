select * from files
where id = $1 and user_id = $2
limit 1
