import gleam/dynamic/decode
import gleam/http/request
import gleam/http/response
import gleam/int
import gleam/json
import gleam/result
import gwt
import wisp.{type Request, type Response}
import youid/uuid.{type Uuid}

import app/auth/jwt
import app/context.{type Context}
import app/util/cookie

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
  req: Request,
  decoder: decode.Decoder(a),
  next: fn(a) -> Response,
) -> Response {
  use json <- wisp.require_json(req)
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

pub fn require_auth(
  req: Request,
  ctx: Context,
  next: fn(Uuid) -> Response,
) -> Response {
  let maybe_token =
    case request.get_header(req, "authorization") {
      Ok("Bearer " <> token) -> Ok(token)
      _ -> Error(Nil)
    }
    |> result.lazy_or(fn() { cookie.get_cookie(req, "token") })

  let maybe_id =
    maybe_token
    |> result.try(fn(token) {
      token
      |> jwt.decode_jwt(ctx.secret)
      |> result.try(gwt.get_subject)
      |> result.replace_error(Nil)
      |> result.try(uuid.from_string)
    })

  case maybe_id {
    Ok(id) -> next(id)
    _ -> wisp.response(401)
  }
}

pub fn limit_request_size(
  req: Request,
  max_size: Int,
  next: fn() -> Response,
) -> Response {
  req
  |> request.get_header("content-length")
  |> result.then(int.parse)
  |> result.unwrap(0)
  |> fn(content_length) {
    case content_length {
      size if size <= max_size -> next()
      _ ->
        wisp.response(413)
        |> response.set_header("Connection", "close")
    }
  }
}
