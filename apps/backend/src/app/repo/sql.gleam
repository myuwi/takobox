import gleam/dynamic/decode
import pog
import youid/uuid.{type Uuid}

/// A row you get from running the `get_user_by_id` query
/// defined in `./src/app/repo/sql/get_user_by_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v3.0.1 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type GetUserByIdRow {
  GetUserByIdRow(id: Uuid, username: String, password: String)
}

/// Runs the `get_user_by_id` query
/// defined in `./src/app/repo/sql/get_user_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v3.0.1 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn get_user_by_id(db, arg_1) {
  let decoder = {
    use id <- decode.field(0, uuid_decoder())
    use username <- decode.field(1, decode.string)
    use password <- decode.field(2, decode.string)
    decode.success(GetUserByIdRow(id:, username:, password:))
  }

  "select * from users where id = $1
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `get_user_by_username` query
/// defined in `./src/app/repo/sql/get_user_by_username.sql`.
///
/// > 🐿️ This type definition was generated automatically using v3.0.1 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type GetUserByUsernameRow {
  GetUserByUsernameRow(id: Uuid, username: String, password: String)
}

/// Runs the `get_user_by_username` query
/// defined in `./src/app/repo/sql/get_user_by_username.sql`.
///
/// > 🐿️ This function was generated automatically using v3.0.1 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn get_user_by_username(db, arg_1) {
  let decoder = {
    use id <- decode.field(0, uuid_decoder())
    use username <- decode.field(1, decode.string)
    use password <- decode.field(2, decode.string)
    decode.success(GetUserByUsernameRow(id:, username:, password:))
  }

  "select * from users where username = $1
"
  |> pog.query
  |> pog.parameter(pog.text(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `create_session` query
/// defined in `./src/app/repo/sql/create_session.sql`.
///
/// > 🐿️ This type definition was generated automatically using v3.0.1 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreateSessionRow {
  CreateSessionRow(id: Uuid, user_id: Uuid, created_at: Int, expires_at: Int)
}

/// Runs the `create_session` query
/// defined in `./src/app/repo/sql/create_session.sql`.
///
/// > 🐿️ This function was generated automatically using v3.0.1 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn create_session(db, arg_1, arg_2) {
  let decoder = {
    use id <- decode.field(0, uuid_decoder())
    use user_id <- decode.field(1, uuid_decoder())
    use created_at <- decode.field(2, decode.int)
    use expires_at <- decode.field(3, decode.int)
    decode.success(CreateSessionRow(id:, user_id:, created_at:, expires_at:))
  }

  "insert into sessions (user_id, expires_at)
values ($1, now() + make_interval(secs => $2::integer))
returning
  id,
  user_id,
  (extract(epoch from created_at))::bigint as created_at,
  (extract(epoch from expires_at))::bigint as expires_at
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.parameter(pog.int(arg_2))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// Runs the `delete_session` query
/// defined in `./src/app/repo/sql/delete_session.sql`.
///
/// > 🐿️ This function was generated automatically using v3.0.1 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn delete_session(db, arg_1) {
  let decoder = decode.map(decode.dynamic, fn(_) { Nil })

  "delete from sessions 
where id = $1
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `get_session_by_id` query
/// defined in `./src/app/repo/sql/get_session_by_id.sql`.
///
/// > 🐿️ This type definition was generated automatically using v3.0.1 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type GetSessionByIdRow {
  GetSessionByIdRow(id: Uuid, user_id: Uuid, created_at: Int, expires_at: Int)
}

/// Runs the `get_session_by_id` query
/// defined in `./src/app/repo/sql/get_session_by_id.sql`.
///
/// > 🐿️ This function was generated automatically using v3.0.1 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn get_session_by_id(db, arg_1) {
  let decoder = {
    use id <- decode.field(0, uuid_decoder())
    use user_id <- decode.field(1, uuid_decoder())
    use created_at <- decode.field(2, decode.int)
    use expires_at <- decode.field(3, decode.int)
    decode.success(GetSessionByIdRow(id:, user_id:, created_at:, expires_at:))
  }

  "select
  id,
  user_id,
  (extract(epoch from created_at))::bigint as created_at,
  (extract(epoch from expires_at))::bigint as expires_at
from sessions
where id = $1
  and expires_at > now()
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `create_user` query
/// defined in `./src/app/repo/sql/create_user.sql`.
///
/// > 🐿️ This type definition was generated automatically using v3.0.1 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CreateUserRow {
  CreateUserRow(id: Uuid, username: String, password: String)
}

/// Runs the `create_user` query
/// defined in `./src/app/repo/sql/create_user.sql`.
///
/// > 🐿️ This function was generated automatically using v3.0.1 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn create_user(db, arg_1, arg_2, arg_3) {
  let decoder = {
    use id <- decode.field(0, uuid_decoder())
    use username <- decode.field(1, decode.string)
    use password <- decode.field(2, decode.string)
    decode.success(CreateUserRow(id:, username:, password:))
  }

  "insert into users (id, username, password) values ($1, $2, $3) returning *
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.parameter(pog.text(arg_2))
  |> pog.parameter(pog.text(arg_3))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

// --- Encoding/decoding utils -------------------------------------------------

/// A decoder to decode `Uuid`s coming from a Postgres query.
///
fn uuid_decoder() {
  use bit_array <- decode.then(decode.bit_array)
  case uuid.from_bit_array(bit_array) {
    Ok(uuid) -> decode.success(uuid)
    Error(_) -> decode.failure(uuid.v7(), "uuid")
  }
}
