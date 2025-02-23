import gleam/http.{Get}
import wisp.{type Request, type Response}

import app/web

pub fn handle_request(req: Request) -> Response {
  use req <- web.middleware(req)
  case wisp.path_segments(req) {
    [] -> root(req)
    _ -> wisp.not_found()
  }
}

fn root(req: Request) -> Response {
  use <- wisp.require_method(req, Get)

  wisp.ok()
  |> wisp.string_body("Hello Takobox API!")
}
