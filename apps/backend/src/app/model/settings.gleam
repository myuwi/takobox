import gleam/dynamic/decode
import gleam/json

pub type Settings {
  Settings(max_file_size: Int)
}

pub fn default() -> Settings {
  Settings(max_file_size: 32_000_000)
}

pub fn encode_settings(settings: Settings) -> json.Json {
  json.object([#("maxFileSize", json.int(settings.max_file_size))])
}

pub fn settings_decoder() -> decode.Decoder(Settings) {
  use max_file_size <- decode.field("maxFileSize", decode.int)
  decode.success(Settings(max_file_size:))
}
