import envoy
import gleam/erlang/process
import gleam/result
import mist
import pog
import wisp
import wisp/wisp_mist

import app/context.{Context}
import app/router

const uploads_path = "../../uploads/"

fn db_config() -> pog.Config {
  let name = process.new_name("pog_pool")

  let assert Ok(config) =
    envoy.get("DATABASE_URL")
    |> result.try(pog.url_config(name, _))

  config
}

pub fn main() {
  wisp.configure_logger()

  let assert Ok(actor) = pog.start(db_config())
  let db = actor.data

  let assert Ok(secret) = envoy.get("SECRET")

  let env = context.read_env()

  let ctx = Context(db:, secret:, env:, uploads_path:)

  let assert Ok(_) =
    router.handle_request(_, ctx)
    |> wisp_mist.handler(ctx.secret)
    |> mist.new()
    |> mist.bind("0.0.0.0")
    |> mist.port(8000)
    |> mist.start()

  process.sleep_forever()
}
