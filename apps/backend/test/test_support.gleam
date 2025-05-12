import envoy
import gleam/result
import pog
import youid/uuid

import app/auth/jwt
import app/context.{type Context, Context, Production}
import app/repo/repo

pub fn with_context(test_case: fn(Context) -> Nil) {
  let assert Ok(db) =
    envoy.get("TEST_DATABASE_URL")
    |> result.try(pog.url_config)
    |> result.map(pog.connect)

  pog.transaction(db, fn(db) {
    let ctx = Context(db:, secret: "test_secret", env: Production)

    test_case(ctx)
    Error("Rollback")
  })
}

pub fn with_session(ctx: Context, test_case: fn(String) -> Nil) {
  let assert Ok(user) = repo.create_user(ctx.db, "test", "password")

  user.id
  |> uuid.to_string()
  |> jwt.create_jwt(ctx.secret)
  |> test_case()
}
