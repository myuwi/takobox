import gleam/dynamic/decode
import gleam/json

pub type Token {
  Token(token: String)
}

pub fn encode_token(token: Token) -> json.Json {
  json.object([#("token", json.string(token.token))])
}

pub fn token_decoder() -> decode.Decoder(Token) {
  use token <- decode.field("token", decode.string)
  decode.success(Token(token:))
}
