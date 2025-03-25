import pog
import youid/uuid.{type Uuid}

pub type Context {
  Context(db: pog.Connection, secret: String)
}

pub type RequestContext {
  RequestContext(user_id: Uuid)
}
