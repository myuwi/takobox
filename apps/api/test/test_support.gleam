import app/context.{type Context, Context}
import envoy
import gleam/result
import pog

pub fn with_context(test_case: fn(Context) -> Nil) {
  let assert Ok(db) =
    envoy.get("TEST_DATABASE_URL")
    |> result.try(pog.url_config)
    |> result.map(pog.connect)

  pog.transaction(db, fn(db) {
    let ctx = Context(db:, secret: "test_secret")

    test_case(ctx)
    Error("Rollback")
  })
}
