import gleam/dynamic/decode
import gleam/time/timestamp
import youid/uuid

pub fn uuid_decoder() {
  use uuid_string <- decode.then(decode.string)
  case uuid.from_string(uuid_string) {
    Ok(uuid) -> decode.success(uuid)
    Error(_) -> decode.failure(uuid.v7(), "uuid")
  }
}

pub fn timestamp_decoder() {
  use timestamp_string <- decode.then(decode.string)
  case timestamp.parse_rfc3339(timestamp_string) {
    Ok(timestamp) -> decode.success(timestamp)
    Error(_) -> decode.failure(timestamp.system_time(), "timestamp")
  }
}
