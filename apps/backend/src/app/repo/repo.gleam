import gleam/list
import gleam/result
import pog
import youid/uuid.{type Uuid}

import app/auth/password
import app/model/file.{type File, File}
import app/repo/sql

pub type DatabaseError {
  RowNotFound
  MultipleRowsReturned
  QueryError(pog.QueryError)
}

fn get_one(res: pog.Returned(a)) -> Result(a, DatabaseError) {
  case res.rows {
    [row] -> Ok(row)
    [_, ..] -> Error(MultipleRowsReturned)
    _ -> Error(RowNotFound)
  }
}

// Users

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

// Sessions

pub fn create_session(
  conn: pog.Connection,
  user_id: Uuid,
  expires_in_seconds: Int,
) -> Result(sql.CreateSessionRow, DatabaseError) {
  sql.create_session(conn, user_id, expires_in_seconds)
  |> result.map_error(QueryError)
  |> result.try(get_one)
}

pub fn get_session_by_id(
  conn: pog.Connection,
  id: Uuid,
) -> Result(sql.GetSessionByIdRow, DatabaseError) {
  sql.get_session_by_id(conn, id)
  |> result.map_error(QueryError)
  |> result.try(get_one)
}

pub fn delete_session(
  conn: pog.Connection,
  id: Uuid,
) -> Result(Nil, DatabaseError) {
  sql.delete_session(conn, id)
  |> result.map_error(QueryError)
  |> result.replace(Nil)
}

// Files

pub fn create_file(
  conn conn: pog.Connection,
  user_id user_id: Uuid,
  name name: String,
  original original: String,
  size size: Int,
) -> Result(sql.CreateFileRow, DatabaseError) {
  sql.create_file(conn, user_id, name, original, size)
  |> result.map_error(QueryError)
  |> result.try(get_one)
}

pub fn get_files_by_user_id(
  conn: pog.Connection,
  user_id: Uuid,
) -> Result(List(File), DatabaseError) {
  sql.get_files_by_user_id(conn, user_id)
  |> result.map(fn(res) {
    list.map(res.rows, fn(row) {
      File(
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        original: row.original,
        size: row.size,
        created_at: row.created_at,
      )
    })
  })
  |> result.map_error(QueryError)
}
