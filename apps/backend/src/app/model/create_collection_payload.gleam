import gleam/dynamic/decode

pub type CreateCollectionPayload {
  CreateCollectionPayload(name: String)
}

pub fn create_collection_payload_decoder() -> decode.Decoder(
  CreateCollectionPayload,
) {
  use name <- decode.field("name", decode.string)
  decode.success(CreateCollectionPayload(name:))
}
