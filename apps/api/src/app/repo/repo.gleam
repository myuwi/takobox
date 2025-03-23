import gleam/option.{None, Some}
import gleam/result
import pog
import youid/uuid

import app/auth/password
import app/repo/sql

pub fn create_user(
  conn: pog.Connection,
  username: String,
  password: String,
) -> Result(sql.CreateUserRow, pog.QueryError) {
  let uuid = uuid.v4()
  let password_hash = password.hash_password(password)

  use res <- result.try(sql.create_user(conn, uuid, username, password_hash))

  let assert pog.Returned(rows: [user], ..) = res

  Ok(user)
}

pub fn get_user_by_username(
  conn: pog.Connection,
  username: String,
) -> Result(option.Option(sql.GetUserByUsernameRow), pog.QueryError) {
  use res <- result.try(sql.get_user_by_username(conn, username))

  case res {
    pog.Returned(rows: [user], ..) -> Ok(Some(user))
    _ -> Ok(None)
  }
}
