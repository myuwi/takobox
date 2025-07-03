import envoy
import gleam/result
import pog
import youid/uuid

import app/context.{type Context, Context, Production}
import app/repo/repo

pub fn with_context(test_case: fn(Context) -> Nil) {
  let assert Ok(db) =
    envoy.get("TEST_DATABASE_URL")
    |> result.try(pog.url_config)
    |> result.map(pog.connect)

  use db <- pog.transaction(db)

  let ctx =
    Context(
      db:,
      secret: "tJitWtqfgFgNhpj1CUKuJbhiDn7L+eoieYDQJWfv7IC9XdH16keoKF7Ob2VSq3OLb4puwAmIg96yH9fX",
      env: Production,
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
