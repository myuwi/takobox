import gleam/http.{Get}
import wisp.{type Request, type Response}

pub fn handle_request(req: Request) -> Response {
  use <- wisp.require_method(req, Get)

  wisp.ok()
  |> wisp.string_body("Hello Takobox API!")
}
