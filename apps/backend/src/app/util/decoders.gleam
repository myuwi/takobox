import gleam/dynamic/decode
import youid/uuid

pub fn uuid_decoder() {
  use uuid_string <- decode.then(decode.string)
  case uuid.from_string(uuid_string) {
    Ok(uuid) -> decode.success(uuid)
    Error(_) -> decode.failure(uuid.v7(), "uuid")
  }
}
