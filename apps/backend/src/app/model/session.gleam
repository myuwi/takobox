import youid/uuid.{type Uuid}

pub type Session {
  Session(id: Uuid, user_id: Uuid, created_at: Int, expires_at: Int)
}
