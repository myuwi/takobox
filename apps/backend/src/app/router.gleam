import wisp.{type Request, type Response}

import app/context.{type Context, RequestContext}
import app/handlers/auth/login
import app/handlers/auth/register
import app/handlers/me
import app/handlers/root
import app/web

pub fn handle_request(req: Request, ctx: Context) -> Response {
  use req <- web.middleware(req)

  case wisp.path_segments(req) {
    [] -> root.handle_request(req)
    ["auth", ..rest] -> auth_router(rest, req, ctx)
    _ -> protected_router(req, ctx)
  }
}

fn auth_router(
  path_segments: List(String),
  req: Request,
  ctx: Context,
) -> Response {
  case path_segments {
    ["login"] -> login.handle_request(req, ctx)
    ["register"] -> register.handle_request(req, ctx)
    _ -> wisp.not_found()
  }
}

fn protected_router(req: Request, ctx: Context) -> Response {
  use user_id <- web.require_auth(req, ctx)
  let req_ctx = RequestContext(user_id:)

  case wisp.path_segments(req) {
    ["me"] -> me.handle_request(req, ctx, req_ctx)
    _ -> wisp.not_found()
  }
}
