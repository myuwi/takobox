import gleam/dynamic/decode
import gleam/json

pub type AuthPayload {
  AuthPayload(username: String, password: String)
}

pub fn encode_auth_payload(auth_payload: AuthPayload) -> json.Json {
  json.object([
    #("username", json.string(auth_payload.username)),
    #("password", json.string(auth_payload.password)),
  ])
}

pub fn auth_payload_decoder() -> decode.Decoder(AuthPayload) {
  use username <- decode.field("username", decode.string)
  use password <- decode.field("password", decode.string)
  decode.success(AuthPayload(username:, password:))
}
