import envoy
import gleam/erlang/process
import gleam/result
import mist
import pog
import wisp
import wisp/wisp_mist

import app/context.{Context}
import app/router

pub fn main() {
  wisp.configure_logger()

  let assert Ok(db) =
    envoy.get("DATABASE_URL")
    |> result.try(pog.url_config)
    |> result.map(pog.connect)

  let assert Ok(secret) = envoy.get("SECRET")

  let env = context.read_env()

  let ctx = Context(db:, secret:, env:)

  let assert Ok(_) =
    router.handle_request(_, ctx)
    |> wisp_mist.handler(ctx.secret)
    |> mist.new()
    |> mist.bind("0.0.0.0")
    |> mist.port(8000)
    |> mist.start_http()

  process.sleep_forever()
}
