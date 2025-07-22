import filepath
import given
import gleam/int
import gleam/json
import gleam/list
import gleam/result
import simplifile.{Enoent}
import wisp.{type Request, type Response}
import youid/uuid

import app/context.{type Context, type RequestContext}
import app/model/file.{encode_file}
import app/model/settings
import app/repo/repo
import app/util/thumbnails.{ShellError, UnsupportedFiletype}
import app/web

pub fn index(_req: Request, ctx: Context, req_ctx: RequestContext) -> Response {
  let assert Ok(files) =
    repo.get_files_by_user_id(ctx.db, req_ctx.session.user_id)

  files
  |> list.map(encode_file)
  |> json.preprocessed_array()
  |> json.to_string_tree()
  |> wisp.json_response(200)
}

pub fn create(req: Request, ctx: Context, req_ctx: RequestContext) -> Response {
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
    web.json_message_response(
      "Expected 1 file, but received "
        <> files |> list.length() |> int.to_string()
        <> ".",
      400,
    )
  })

  let ext = filepath.extension(file.file_name)
  let ext_string =
    ext
    |> result.map(fn(ext) { "." <> ext })
    |> result.unwrap("")

  // TODO: retry on db collision
  let file_id = wisp.random_string(12)
  let file_name = file_id <> ext_string

  let assert Ok(file_info) = simplifile.file_info(file.path)

  let upload_path = filepath.join(ctx.uploads_path, file_name)

  // TODO: Move instead
  let assert Ok(Nil) = simplifile.copy_file(file.path, upload_path)

  let assert Ok(_) =
    repo.create_file(
      conn: ctx.db,
      user_id: req_ctx.session.user_id,
      name: file_name,
      original: file.file_name,
      size: file_info.size,
    )

  case thumbnails.generate_thumbnail(upload_path, ctx) {
    Ok(_) | Error(UnsupportedFiletype) -> Nil
    Error(ShellError(_, message)) ->
      wisp.log_error(
        "Error creating thumbnail for \"" <> upload_path <> "\": " <> message,
      )
  }

  wisp.ok()
}

pub fn delete(
  _req: Request,
  ctx: Context,
  req_ctx: RequestContext,
  id: String,
) -> Response {
  use file_id <- given.ok(uuid.from_string(id), fn(_) {
    web.json_message_response("Invalid file id.", 400)
  })

  let res =
    repo.delete_file_by_id(
      conn: ctx.db,
      id: file_id,
      user_id: req_ctx.session.user_id,
    )

  use deleted_file <- given.ok(res, fn(_) {
    web.json_message_response(
      "File doesn't exist or belongs to another user.",
      404,
    )
  })

  let file_path = filepath.join(ctx.uploads_path, deleted_file.name)
  let file_id = filepath.strip_extension(deleted_file.name)
  let thumb_path = filepath.join(ctx.thumbs_path, file_id <> ".webp")

  case simplifile.delete(file_path) {
    Ok(_) -> Nil
    Error(delete_error) ->
      wisp.log_warning(
        "Deleting file \""
        <> file_path
        <> "\" failed with the error: "
        <> simplifile.describe_error(delete_error),
      )
  }

  case simplifile.delete(thumb_path) {
    Ok(_) | Error(Enoent) -> Nil
    Error(delete_error) ->
      wisp.log_warning(
        "Deleting file \""
        <> thumb_path
        <> "\" failed with the error: "
        <> simplifile.describe_error(delete_error),
      )
  }

  wisp.ok()
}

pub fn regenerate_thumbnail(
  _req: Request,
  ctx: Context,
  req_ctx: RequestContext,
  id: String,
) -> Response {
  use file_id <- given.ok(uuid.from_string(id), fn(_) {
    web.json_message_response("Invalid file id.", 400)
  })

  let file =
    repo.get_file_by_id(
      conn: ctx.db,
      id: file_id,
      user_id: req_ctx.session.user_id,
    )

  use file <- given.ok(file, fn(_) {
    web.json_message_response(
      "File doesn't exist or belongs to another user.",
      404,
    )
  })

  let upload_path = filepath.join(ctx.uploads_path, file.name)

  case thumbnails.generate_thumbnail(upload_path, ctx) {
    Ok(_) -> wisp.ok()
    Error(UnsupportedFiletype) -> {
      web.json_message_response("Filetype doesn't support thumbnails.", 400)
    }
    Error(ShellError(_, message)) -> {
      wisp.log_error(
        "Error creating thumbnail for \"" <> upload_path <> "\": " <> message,
      )
      web.json_message_response(
        "Unable to generate thumbnail for the selected file.",
        500,
      )
    }
  }
}
