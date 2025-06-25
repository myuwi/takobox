import gleam/http.{Get}
import gleam/json
import wisp.{type Request, type Response}

import app/context.{type Context, type RequestContext}

pub fn router(
  path_segments: List(String),
  req: Request,
  ctx: Context,
  req_ctx: RequestContext,
) -> Response {
  case req.method, path_segments {
    Get, [] -> get_files(req, ctx, req_ctx)
    _, _ -> wisp.not_found()
  }
}

fn get_files(req: Request, _ctx: Context, _req_ctx: RequestContext) -> Response {
  use <- wisp.require_method(req, Get)

  json.array([], of: json.object)
  |> json.to_string_tree()
  |> wisp.json_response(200)
}
