import gleam/http.{Get}
import gleam/json
import wisp.{type Request, type Response}

import app/context.{type Context}
import app/model/settings

pub fn handle_request(req: Request, _ctx: Context) -> Response {
  use <- wisp.require_method(req, Get)

  settings.default()
  |> settings.encode_settings()
  |> json.to_string_tree()
  |> wisp.json_response(200)
}
