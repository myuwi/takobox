import app/model/session.{type Session}
import envoy
import pog

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

pub type RequestContext {
  RequestContext(session: Session)
}
