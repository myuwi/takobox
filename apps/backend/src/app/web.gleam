import gleam/dynamic/decode
import gleam/http/request
import gleam/http/response
import gleam/int
import gleam/json
import gleam/result
import wisp.{type Request, type Response}
import youid/uuid

import app/context.{type Context}
import app/model/session.{type Session, Session}
import app/repo/repo

pub fn middleware(
  req: wisp.Request,
  handle_request: fn(wisp.Request) -> wisp.Response,
) -> wisp.Response {
  let req = wisp.method_override(req)
  use <- wisp.log_request(req)
  use <- wisp.rescue_crashes()
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

pub fn json_message_response(msg: String, code: Int) -> Response {
  json.object([#("message", json.string(msg))])
  |> json.to_string_tree()
  |> wisp.json_response(code)
}

pub fn require_auth(
  req: Request,
  ctx: Context,
  next: fn(Session) -> Response,
) -> Response {
  let maybe_session =
    wisp.get_cookie(req, "session", wisp.Signed)
    |> result.try(uuid.from_string)
    |> result.try(fn(id) {
      repo.get_session_by_id(ctx.db, id)
      |> result.replace_error(Nil)
    })

  case maybe_session {
    Ok(session) -> {
      let session =
        Session(
          id: session.id,
          user_id: session.user_id,
          created_at: session.created_at,
          expires_at: session.expires_at,
        )
      next(session)
    }
    _ -> {
      wisp.response(401)
      |> wisp.set_cookie(req, "session", "", wisp.Signed, 0)
    }
  }
}

pub fn limit_request_size(
  req: Request,
  max_size: Int,
  next: fn() -> Response,
) -> Response {
  req
  |> request.get_header("content-length")
  |> result.try(int.parse)
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
