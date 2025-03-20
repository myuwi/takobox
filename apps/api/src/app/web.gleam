import gleam/dynamic/decode
import gleam/json
import wisp.{type Request, type Response}

pub fn middleware(
  req: wisp.Request,
  handle_request: fn(wisp.Request) -> wisp.Response,
) -> wisp.Response {
  let req = wisp.method_override(req)
  use <- wisp.log_request(req)
  use <- wisp.rescue_crashes
  use req <- wisp.handle_head(req)

  handle_request(req)
}

pub fn require_json_decoded(
  request: Request,
  decoder: decode.Decoder(a),
  next: fn(a) -> Response,
) -> Response {
  use json <- wisp.require_json(request)
  case decode.run(json, decoder) {
    Ok(a) -> next(a)
    Error(_) -> wisp.bad_request()
  }
}

pub fn json_error_response(msg: String, code: Int) -> Response {
  json.object([#("message", json.string(msg))])
  |> json.to_string_tree()
  |> wisp.json_response(code)
}
