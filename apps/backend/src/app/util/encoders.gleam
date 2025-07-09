import gleam/string
import gleam/time/calendar
import gleam/time/timestamp.{type Timestamp}
import youid/uuid.{type Uuid}

pub fn encode_uuid(uuid: Uuid) -> String {
  uuid.to_string(uuid) |> string.lowercase
}

pub fn encode_timestamp(timestamp: Timestamp) -> String {
  timestamp.to_rfc3339(timestamp, calendar.utc_offset)
}
