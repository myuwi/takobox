import gleam/dynamic/decode
import gleam/json
import gleam/time/timestamp.{type Timestamp}
import youid/uuid.{type Uuid}

import app/util/decoders.{timestamp_decoder, uuid_decoder}
import app/util/encoders.{encode_timestamp, encode_uuid}

pub type Collection {
  Collection(id: Uuid, user_id: Uuid, name: String, created_at: Timestamp)
}

pub fn encode_collection(collection: Collection) -> json.Json {
  let Collection(id:, user_id:, name:, created_at:) = collection
  json.object([
    #("id", json.string(encode_uuid(id))),
    #("userId", json.string(encode_uuid(user_id))),
    #("name", json.string(name)),
    #("createdAt", json.string(encode_timestamp(created_at))),
  ])
}

pub fn collection_decoder() -> decode.Decoder(Collection) {
  use id <- decode.field("id", uuid_decoder())
  use user_id <- decode.field("userId", uuid_decoder())
  use name <- decode.field("name", decode.string)
  use created_at <- decode.field("createdAt", timestamp_decoder())
  decode.success(Collection(id:, user_id:, name:, created_at:))
}
