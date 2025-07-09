import gleam/dynamic/decode
import gleam/json
import gleam/time/timestamp.{type Timestamp}
import youid/uuid.{type Uuid}

import app/util/decoders.{timestamp_decoder, uuid_decoder}
import app/util/encoders.{encode_timestamp, encode_uuid}

pub type File {
  File(
    id: Uuid,
    user_id: Uuid,
    name: String,
    original: String,
    size: Int,
    created_at: Timestamp,
  )
}

pub fn encode_file(file: File) -> json.Json {
  let File(id:, user_id:, name:, original:, size:, created_at:) = file
  json.object([
    #("id", json.string(encode_uuid(id))),
    #("userId", json.string(encode_uuid(user_id))),
    #("name", json.string(name)),
    #("original", json.string(original)),
    #("size", json.int(size)),
    #("createdAt", json.string(encode_timestamp(created_at))),
  ])
}

pub fn file_decoder() -> decode.Decoder(File) {
  use id <- decode.field("id", uuid_decoder())
  use user_id <- decode.field("userId", uuid_decoder())
  use name <- decode.field("name", decode.string)
  use original <- decode.field("original", decode.string)
  use size <- decode.field("size", decode.int)
  use created_at <- decode.field("createdAt", timestamp_decoder())
  decode.success(File(id:, user_id:, name:, original:, size:, created_at:))
}
