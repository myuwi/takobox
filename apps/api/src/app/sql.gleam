import gleam/dynamic/decode
import pog
import youid/uuid.{type Uuid}

/// A row you get from running the `get_user_by_username` query
/// defined in `./src/app/sql/get_user_by_username.sql`.
///
/// > 🐿️ This type definition was generated automatically using v3.0.1 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type GetUserByUsernameRow {
  GetUserByUsernameRow(id: Uuid, username: String, password: String)
}

/// Runs the `get_user_by_username` query
/// defined in `./src/app/sql/get_user_by_username.sql`.
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

  "select *
from users
where username = $1
"
  |> pog.query
  |> pog.parameter(pog.text(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// Runs the `create_user` query
/// defined in `./src/app/sql/create_user.sql`.
///
/// > 🐿️ This function was generated automatically using v3.0.1 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn create_user(db, arg_1, arg_2, arg_3) {
  let decoder = decode.map(decode.dynamic, fn(_) { Nil })

  "insert into users (id, username, password)
values ($1, $2, $3)
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
