import gleam/http.{Get}
import gleam/json
import wisp.{type Request, type Response}

import app/context.{type Context, type RequestContext}
import app/model/user.{User}
import app/repo/repo

pub fn me_handler(
  req: Request,
  ctx: Context,
  req_ctx: RequestContext,
) -> Response {
  use <- wisp.require_method(req, Get)

  // A user id should always correspond to a single valid user
  let assert Ok(user) = repo.get_user_by_id(ctx.db, req_ctx.user_id)

  User(id: user.id, username: user.username)
  |> user.encode_user()
  |> json.to_string_tree()
  |> wisp.json_response(200)
}
