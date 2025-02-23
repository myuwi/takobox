import dot_env
import dot_env/env
import gleam/erlang/process
import mist
import wisp
import wisp/wisp_mist

import app/router

pub fn main() {
  wisp.configure_logger()

  dot_env.new()
  |> dot_env.set_path(".env")
  |> dot_env.set_debug(False)
  |> dot_env.load()

  let assert Ok(secret) = env.get_string("SECRET")

  let assert Ok(_) =
    router.handle_request
    |> wisp_mist.handler(secret)
    |> mist.new()
    |> mist.port(8000)
    |> mist.start_http()

  process.sleep_forever()
}
