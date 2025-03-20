import given
import gleam/bool
import gleam/dynamic/decode
import gleam/http.{Post}
import gleam/json
import gleam/regexp
import gleam/string
import pog.{ConstraintViolated}
import wisp.{type Request, type Response}
import youid/uuid

import app/auth/jwt
import app/auth/password
import app/context.{type Context}
import app/sql
import app/web

pub type AuthBody {
  AuthBody(username: String, password: String)
}

fn auth_body_decoder() -> decode.Decoder(AuthBody) {
  use username <- decode.field("username", decode.string)
  use password <- decode.field("password", decode.string)
  decode.success(AuthBody(username:, password:))
}

fn validate_register_body(
  username: String,
  password: String,
) -> Result(Nil, String) {
  let assert Ok(re) = regexp.from_string("^[a-z0-9_-]+$")

  use <- bool.guard(
    !regexp.check(re, username),
    Error(
      "Username may only contain lowercase letters (a-z), numbers (0-9), underscores (_), and hyphens (-)",
    ),
  )
  use <- bool.guard(
    string.length(username) < 4 && string.length(username) > 32,
    Error("Username must be between 4 and 32 characters"),
  )
  use <- bool.guard(
    string.length(password) < 6 && string.length(password) > 32,
    Error("Password must be between 6 and 32 characters"),
  )
  Ok(Nil)
}

fn create_user_query_error_to_string(err: pog.QueryError) -> String {
  case err {
    ConstraintViolated(_, "users_username_key", _) ->
      "Username is already taken"
    ConstraintViolated(_, "users_username_check", _) -> "Username is invalid"
    _ -> "Unable to create user"
  }
}

pub fn register_handler(req: Request, ctx: Context) -> Response {
  use <- wisp.require_method(req, Post)
  use auth_body <- web.require_json_decoded(req, auth_body_decoder())
  let AuthBody(username, password) = auth_body

  use _ <- given.ok(
    validate_register_body(username, password),
    web.json_error_response(_, 400),
  )

  let uuid = uuid.v4()
  let password_hash = password.hash_password(password)

  use _ <- given.ok(
    sql.create_user(ctx.db, uuid, username, password_hash),
    fn(err) {
      create_user_query_error_to_string(err)
      |> web.json_error_response(400)
    },
  )

  let token =
    uuid
    |> uuid.to_string()
    |> jwt.create_jwt(ctx.secret)

  json.object([#("token", json.string(token))])
  |> json.to_string_tree()
  |> wisp.json_response(201)
}

pub fn login_handler(req: Request, ctx: Context) -> Response {
  use <- wisp.require_method(req, Post)
  use auth_body <- web.require_json_decoded(req, auth_body_decoder())
  let AuthBody(username, password) = auth_body

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

  json.object([#("token", json.string(token))])
  |> json.to_string_tree()
  |> wisp.json_response(201)
}
