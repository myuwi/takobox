import gleam/result
import pog
import youid/uuid.{type Uuid}

import app/auth/password
import app/repo/sql

pub type DatabaseError {
  RowNotFound
  MultipleRowsReturned
  QueryError(pog.QueryError)
}

pub fn create_user(
  conn: pog.Connection,
  username: String,
  password: String,
) -> Result(sql.CreateUserRow, DatabaseError) {
  let uuid = uuid.v4()
  let password_hash = password.hash_password(password)

  sql.create_user(conn, uuid, username, password_hash)
  |> result.map_error(QueryError)
  |> result.try(get_one)
}

pub fn get_user_by_username(
  conn: pog.Connection,
  username: String,
) -> Result(sql.GetUserByUsernameRow, DatabaseError) {
  sql.get_user_by_username(conn, username)
  |> result.map_error(QueryError)
  |> result.try(get_one)
}

pub fn get_user_by_id(
  conn: pog.Connection,
  id: Uuid,
) -> Result(sql.GetUserByIdRow, DatabaseError) {
  sql.get_user_by_id(conn, id)
  |> result.map_error(QueryError)
  |> result.try(get_one)
}

fn get_one(res: pog.Returned(a)) -> Result(a, DatabaseError) {
  case res.rows {
    [row] -> Ok(row)
    [_, ..] -> Error(MultipleRowsReturned)
    _ -> Error(RowNotFound)
  }
}
