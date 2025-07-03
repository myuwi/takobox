import app/web
import gleam/http.{Post}
import wisp.{type Request, type Response}

import app/context.{type Context}
import app/repo/repo

pub fn handle_request(req: Request, ctx: Context) -> Response {
  use <- wisp.require_method(req, Post)
  use session <- web.require_auth(req, ctx)

  let assert Ok(Nil) = repo.delete_session(ctx.db, session.id)

  wisp.ok()
  |> wisp.set_cookie(req, "session", "", wisp.Signed, 0)
}
