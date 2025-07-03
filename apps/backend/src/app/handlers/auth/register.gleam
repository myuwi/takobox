import given
import gleam/bool
import gleam/http.{Post}
import gleam/regexp
import gleam/result
import gleam/string
import pog.{ConstraintViolated}
import wisp.{type Request, type Response}
import youid/uuid

import app/context.{type Context}
import app/model/auth_payload.{AuthPayload, auth_payload_decoder}
import app/repo/repo.{type DatabaseError}
import app/web

fn validate_register_payload(
  username: String,
  password: String,
) -> Result(Nil, String) {
  let assert Ok(re) = regexp.from_string("^[a-z0-9_-]+$")

  use <- bool.guard(
    !regexp.check(re, username),
    Error(
      "Username may only contain lowercase letters (a-z), numbers (0-9), underscores (_), and hyphens (-).",
    ),
  )
  use <- bool.guard(
    string.length(username) < 4 || string.length(username) > 32,
    Error("Username must be between 4 and 32 characters."),
  )
  use <- bool.guard(
    string.length(password) < 6 || string.length(password) > 32,
    Error("Password must be between 6 and 32 characters."),
  )
  Ok(Nil)
}

fn database_error_to_response(err: DatabaseError) -> Response {
  case err {
    repo.QueryError(err) -> {
      case err {
        ConstraintViolated(_, "users_username_key", _) ->
          "Username already taken."
        ConstraintViolated(_, "users_username_check", _) ->
          "Username is invalid"
        _ -> "Unable to create user."
      }
      |> web.json_error_response(400)
    }
    _ -> wisp.internal_server_error()
  }
}

pub fn handle_request(req: Request, ctx: Context) -> Response {
  use <- wisp.require_method(req, Post)
  use auth_payload <- web.require_json_decoded(req, auth_payload_decoder())
  let AuthPayload(username, password) = auth_payload

  use _ <- given.ok(
    validate_register_payload(username, password),
    web.json_error_response(_, 400),
  )

  use user <- given.ok(
    repo.create_user(ctx.db, username, password),
    database_error_to_response,
  )

  // TODO: Handle error?
  let assert Ok(session_id) =
    user.id
    |> repo.create_session(ctx.db, _, 30 * 86_400)
    |> result.map(fn(session) { uuid.to_string(session.id) })

  wisp.created()
  |> wisp.set_cookie(req, "session", session_id, wisp.Signed, 30 * 86_400)
}
