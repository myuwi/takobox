import wisp.{type Request, type Response}

import app/context.{type Context}
import app/handlers/auth/login
import app/handlers/auth/logout
import app/handlers/auth/register

pub fn router(
  path_segments: List(String),
  req: Request,
  ctx: Context,
) -> Response {
  case path_segments {
    ["login"] -> login.handle_request(req, ctx)
    ["register"] -> register.handle_request(req, ctx)
    ["logout"] -> logout.handle_request(req, ctx)
    _ -> wisp.not_found()
  }
}
