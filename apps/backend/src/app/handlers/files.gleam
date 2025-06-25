import given
import gleam/http.{Get, Post}
import gleam/int
import gleam/json
import gleam/list
import wisp.{type Request, type Response}

import app/context.{type Context, type RequestContext}
import app/web

pub fn router(
  path_segments: List(String),
  req: Request,
  ctx: Context,
  req_ctx: RequestContext,
) -> Response {
  case req.method, path_segments {
    Get, [] -> get_files(req, ctx, req_ctx)
    Post, [] -> upload_file(req, ctx, req_ctx)
    _, _ -> wisp.not_found()
  }
}

fn get_files(req: Request, _ctx: Context, _req_ctx: RequestContext) -> Response {
  use <- wisp.require_method(req, Get)

  json.array([], of: json.object)
  |> json.to_string_tree()
  |> wisp.json_response(200)
}

fn upload_file(
  req: Request,
  _ctx: Context,
  _req_ctx: RequestContext,
) -> Response {
  let req = req |> wisp.set_max_files_size(32_000_000)
  use <- wisp.require_method(req, Post)
  use <- wisp.require_content_type(req, "multipart/form-data")
  use form <- wisp.require_form(req)

  // TODO: Do this check at the formdata parser level to avoid saving extra files on disk?
  let maybe_file = case form.files {
    [file] -> Ok(file)
    files -> Error(files)
  }

  use file <- given.ok(maybe_file, fn(files) {
    web.json_error_response(
      "Expected 1 file, but received "
        <> files |> list.length() |> int.to_string()
        <> ".",
      400,
    )
  })

  echo file

  wisp.ok()
}
