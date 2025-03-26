import wisp.{type Request, type Response}

import app/context.{type Context, RequestContext}
import app/routes/auth/login
import app/routes/auth/register
import app/routes/me
import app/routes/root
import app/web

pub fn handle_request(req: Request, ctx: Context) -> Response {
  use req <- web.middleware(req)

  case wisp.path_segments(req) {
    [] -> root.root_handler(req)
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
    ["login"] -> login.login_handler(req, ctx)
    ["register"] -> register.register_handler(req, ctx)
    _ -> wisp.not_found()
  }
}

fn protected_router(req: Request, ctx: Context) -> Response {
  use user_id <- web.require_auth(req, ctx)
  let req_ctx = RequestContext(user_id:)

  case wisp.path_segments(req) {
    ["me"] -> me.me_handler(req, ctx, req_ctx)
    _ -> wisp.not_found()
  }
}
