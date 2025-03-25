import gleam/http.{Get}
import wisp.{type Request, type Response}

import app/context.{type Context, RequestContext}
import app/routes/auth/login
import app/routes/auth/register
import app/routes/me
import app/web

pub fn handle_request(req: Request, ctx: Context) -> Response {
  use req <- web.middleware(req)

  case wisp.path_segments(req) {
    [] -> root_handler(req)
    ["auth", ..rest] -> auth_router(rest, req, ctx)
    rest -> router(rest, req, ctx)
  }
}

fn root_handler(req: Request) -> Response {
  use <- wisp.require_method(req, Get)

  wisp.ok()
  |> wisp.string_body("Hello Takobox API!")
}

pub fn auth_router(
  path_segments: List(String),
  req: Request,
  ctx: Context,
) -> Response {
  case path_segments {
    ["login"] -> login.login_handler(req, ctx)
    ["register"] -> register.register_handler(req, ctx)
    _ -> wisp.not_found()
  }
}

pub fn router(
  path_segments: List(String),
  req: Request,
  ctx: Context,
) -> Response {
  use user_id <- web.require_auth(req, ctx)
  let req_ctx = RequestContext(user_id:)

  case path_segments {
    ["me"] -> me.me_handler(req, ctx, req_ctx)
    _ -> wisp.not_found()
  }
}
