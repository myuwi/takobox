import given
import gleam/bool
import gleam/http.{Post}
import gleam/result
import wisp.{type Request, type Response}
import youid/uuid

import app/auth/password
import app/context.{type Context}
import app/model/auth_payload.{AuthPayload, auth_payload_decoder}
import app/repo/repo.{type DatabaseError}
import app/web

fn database_error_to_response(error: DatabaseError) -> Response {
  case error {
    repo.RowNotFound ->
      "Could not find a user with that username."
      |> web.json_error_response(401)
    _ -> wisp.internal_server_error()
  }
}

pub fn handle_request(req: Request, ctx: Context) -> Response {
  use <- wisp.require_method(req, Post)
  use auth_payload <- web.require_json_decoded(req, auth_payload_decoder())
  let AuthPayload(username, password) = auth_payload

  let maybe_user = repo.get_user_by_username(ctx.db, username)

  use user <- given.ok(maybe_user, database_error_to_response)

  use <- bool.lazy_guard(
    !password.verify_password(password, user.password),
    fn() { web.json_error_response("Incorrect password.", 401) },
  )

  // TODO: Handle error?
  let assert Ok(session_id) =
    user.id
    |> repo.create_session(ctx.db, _, 30 * 86_400)
    |> result.map(fn(session) { uuid.to_string(session.id) })

  wisp.ok()
  |> wisp.set_cookie(req, "session", session_id, wisp.Signed, 30 * 86_400)
}
