import app/model/auth_payload.{AuthPayload, auth_payload_decoder}
import app/model/token.{Token, encode_token}
import given
import gleam/bool
import gleam/http.{Post}
import gleam/json
import pog
import wisp.{type Request, type Response}
import youid/uuid

import app/auth/jwt
import app/auth/password
import app/context.{type Context}
import app/sql
import app/web

pub fn login_handler(req: Request, ctx: Context) -> Response {
  use <- wisp.require_method(req, Post)
  use auth_body <- web.require_json_decoded(req, auth_payload_decoder())
  let AuthPayload(username, password) = auth_body

  use res <- given.ok(sql.get_user_by_username(ctx.db, username), fn(_) {
    web.json_error_response("Something went wrong", 500)
  })

  use user <- given.ok(
    case res {
      pog.Returned(rows: [user], ..) -> Ok(user)
      _ -> Error("Couldn't find a user with that username")
    },
    web.json_error_response(_, 401),
  )

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
