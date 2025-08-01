import gleam/dynamic/decode
import gleam/json
import youid/uuid.{type Uuid}

import app/util/decoders.{uuid_decoder}
import app/util/encoders.{encode_uuid}

pub type User {
  User(id: Uuid, username: String)
}

pub fn encode_user(user: User) -> json.Json {
  json.object([
    #("id", json.string(encode_uuid(user.id))),
    #("username", json.string(user.username)),
  ])
}

pub fn user_decoder() -> decode.Decoder(User) {
  use id <- decode.field("id", uuid_decoder())
  use username <- decode.field("username", decode.string)
  decode.success(User(id:, username:))
}
