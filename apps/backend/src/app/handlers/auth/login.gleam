import given
import gleam/bool
import gleam/http.{Post}
import gleam/json
import wisp.{type Request, type Response}
import youid/uuid

import app/auth/jwt
import app/auth/password
import app/context.{type Context}
import app/model/auth_payload.{AuthPayload, auth_payload_decoder}
import app/model/token.{Token}
import app/repo/repo.{type DatabaseError}
import app/web

fn database_error_to_response(error: DatabaseError) -> Response {
  case error {
    repo.RowNotFound ->
      "Couldn't find a user with that username"
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
    fn() { web.json_error_response("Incorrect password", 401) },
  )

  let token_string =
    user.id
    |> uuid.to_string()
    |> jwt.create_jwt(ctx.secret)

  token_string
  |> Token
  |> token.encode_token()
  |> json.to_string_tree()
  |> wisp.json_response(200)
  |> wisp.set_cookie(req, "token", token_string, wisp.PlainText, 30 * 86_400)
}
