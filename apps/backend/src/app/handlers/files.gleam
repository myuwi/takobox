import filepath
import given
import gleam/http.{Get, Post}
import gleam/int
import gleam/json
import gleam/list
import gleam/result
import simplifile
import wisp.{type Request, type Response}

import app/context.{type Context, type RequestContext}
import app/model/file.{encode_file}
import app/model/settings
import app/repo/repo
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

fn get_files(req: Request, ctx: Context, req_ctx: RequestContext) -> Response {
  use <- wisp.require_method(req, Get)
  let assert Ok(files) = repo.get_files_by_user_id(ctx.db, req_ctx.user_id)

  files
  |> list.map(encode_file)
  |> json.preprocessed_array()
  |> json.to_string_tree()
  |> wisp.json_response(200)
}

fn upload_file(req: Request, ctx: Context, req_ctx: RequestContext) -> Response {
  use <- wisp.require_method(req, Post)
  use <- wisp.require_content_type(req, "multipart/form-data")
  // TODO: Move to req_ctx?
  let max_file_size = settings.default().max_file_size
  // FIXME: The client doesn't receive the response when the body has not yet been fully consumed
  use <- web.limit_request_size(req, max_file_size)
  use form <- wisp.require_form(req)

  // TODO: Do this check at the formdata parser level to avoid saving extra files on disk?
  let maybe_file = case form.files {
    [file] -> Ok(file)
    files -> Error(files)
  }

  use #(_, file) <- given.ok(maybe_file, fn(files) {
    web.json_error_response(
      "Expected 1 file, but received "
        <> files |> list.length() |> int.to_string()
        <> ".",
      400,
    )
  })

  let ext = filepath.extension(file.file_name)

  // TODO: retry on db collision
  let name =
    wisp.random_string(12)
    <> ext
    |> result.map(fn(ext) { "." <> ext })
    |> result.unwrap("")

  let assert Ok(file_info) = simplifile.file_info(file.path)

  let new_path = filepath.join(ctx.uploads_path, name)

  // TODO: Move instead
  let assert Ok(Nil) = simplifile.copy_file(file.path, new_path)

  let assert Ok(_) =
    repo.create_file(
      conn: ctx.db,
      user_id: req_ctx.user_id,
      name:,
      original: file.file_name,
      size: file_info.size,
    )

  wisp.ok()
}
