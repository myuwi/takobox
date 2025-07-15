import gleam/json
import wisp.{type Request, type Response}

import app/context.{type Context}
import app/model/settings

pub fn show(_req: Request, _ctx: Context) -> Response {
  settings.default()
  |> settings.encode_settings()
  |> json.to_string_tree()
  |> wisp.json_response(200)
}
