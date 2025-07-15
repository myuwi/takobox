import gleam/http.{Delete, Get, Post}
import wisp.{type Request, type Response}

import app/context.{type Context, RequestContext}
import app/handlers/auth
import app/handlers/files
import app/handlers/me
import app/handlers/root
import app/handlers/settings
import app/web

pub fn handle_request(req: Request, ctx: Context) -> Response {
  use req <- web.middleware(req)

  case req.method, wisp.path_segments(req) {
    Get, [] -> root.index(req, ctx)
    Get, ["settings"] -> settings.show(req, ctx)

    Post, ["auth", "login"] -> auth.login(req, ctx)
    Post, ["auth", "register"] -> auth.register(req, ctx)
    Post, ["auth", "logout"] -> auth.logout(req, ctx)

    _, _ -> protected_routes(req, ctx)
  }
}

fn protected_routes(req: Request, ctx: Context) -> Response {
  use session <- web.require_auth(req, ctx)
  let req_ctx = RequestContext(session: session)

  case req.method, wisp.path_segments(req) {
    Get, ["me"] -> me.show(req, ctx, req_ctx)

    Get, ["files"] -> files.index(req, ctx, req_ctx)
    Post, ["files"] -> files.create(req, ctx, req_ctx)
    Delete, ["files", id] -> files.delete(req, ctx, req_ctx, id)

    _, _ -> wisp.not_found()
  }
}
