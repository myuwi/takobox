import gleam/time/timestamp.{type Timestamp}
import youid/uuid.{type Uuid}

pub type Session {
  Session(id: Uuid, user_id: Uuid, created_at: Timestamp, expires_at: Timestamp)
}
