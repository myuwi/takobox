import envoy
import pog
import youid/uuid.{type Uuid}

pub type Environment {
  Development
  Production
}

pub fn read_env() -> Environment {
  case envoy.get("GLEAM_ENV") {
    Ok("production") -> Production
    _ -> Development
  }
}

pub type Context {
  Context(
    env: Environment,
    db: pog.Connection,
    secret: String,
    uploads_path: String,
  )
}

// TODO: Store session instead of just user_id
pub type RequestContext {
  RequestContext(user_id: Uuid)
}
