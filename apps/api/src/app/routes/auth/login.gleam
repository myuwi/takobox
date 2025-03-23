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
import app/model/token.{Token, encode_token}
import app/repo/repo
import app/web

pub fn login_handler(req: Request, ctx: Context) -> Response {
  use <- wisp.require_method(req, Post)
  use auth_payload <- web.require_json_decoded(req, auth_payload_decoder())
  let AuthPayload(username, password) = auth_payload

  let assert Ok(maybe_user) = repo.get_user_by_username(ctx.db, username)

  use user <- given.some(maybe_user, fn() {
    web.json_error_response("Couldn't find a user with that username", 401)
  })

  use <- bool.lazy_guard(
    !password.verify_password(password, user.password),
    fn() { web.json_error_response("Incorrect password", 401) },
  )

  let token =
    user.id
    |> uuid.to_string()
    |> jwt.create_jwt(ctx.secret)
    |> Token

  token
  |> encode_token()
  |> json.to_string_tree()
  |> wisp.json_response(200)
}
