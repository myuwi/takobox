import envoy
import gleam/erlang/process
import gleam/result
import pog
import youid/uuid

import app/context.{type Context, Context, Production}
import app/repo/repo

fn test_config() -> pog.Config {
  let name = process.new_name("test")
  let assert Ok(config) =
    envoy.get("TEST_DATABASE_URL")
    |> result.try(pog.url_config(name, _))

  config
}

pub fn with_context(test_case: fn(Context) -> Nil) {
  let assert Ok(actor) = pog.start(test_config())
  use db <- pog.transaction(actor.data)

  let ctx =
    Context(
      db:,
      secret: "tJitWtqfgFgNhpj1CUKuJbhiDn7L+eoieYDQJWfv7IC9XdH16keoKF7Ob2VSq3OLb4puwAmIg96yH9fX",
      env: Production,
      uploads_path: "../../uploads",
    )

  test_case(ctx)
  Error("Rollback")
}

pub fn with_session(ctx: Context, test_case: fn(String) -> Nil) -> Nil {
  let assert Ok(user) = repo.create_user(ctx.db, "test", "password")
  let assert Ok(session) = repo.create_session(ctx.db, user.id, 30 * 86_400)

  session.id
  |> uuid.to_string()
  |> test_case
}
