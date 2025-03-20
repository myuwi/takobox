import pog

pub type Context {
  Context(db: pog.Connection, secret: String)
}
