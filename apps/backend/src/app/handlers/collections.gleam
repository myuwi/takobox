import given
import gleam/bool
import gleam/json
import gleam/list
import gleam/string
import pog.{ConstraintViolated}
import wisp.{type Request, type Response}
import youid/uuid

import app/context.{type Context, type RequestContext}
import app/model/collection.{encode_collection}
import app/model/create_collection_payload.{create_collection_payload_decoder}
import app/repo/repo.{type DatabaseError}
import app/web

fn create_collection_database_error_to_response(err: DatabaseError) -> Response {
  case err {
    repo.QueryError(err) -> {
      case err {
        ConstraintViolated(_, "collections_user_id_name_key", _) ->
          "A collection with this name already exists. Please try another name."
        _ -> "Unable to create collection."
      }
      |> web.json_message_response(400)
    }
    _ -> wisp.internal_server_error()
  }
}

pub fn index(_req: Request, ctx: Context, req_ctx: RequestContext) -> Response {
  let assert Ok(collections) =
    repo.get_collections_by_user_id(ctx.db, req_ctx.session.user_id)

  collections
  |> list.map(encode_collection)
  |> json.preprocessed_array()
  |> json.to_string_tree()
  |> wisp.json_response(200)
}

pub fn create(req: Request, ctx: Context, req_ctx: RequestContext) -> Response {
  use new_collection <- web.require_json_decoded(
    req,
    create_collection_payload_decoder(),
  )

  let name =
    new_collection.name
    |> string.trim()

  use <- bool.lazy_guard(string.length(name) == 0, fn() {
    web.json_message_response("Collection name must not be empty", 400)
  })

  use _ <- given.ok(
    repo.create_collection(
      conn: ctx.db,
      user_id: req_ctx.session.user_id,
      name: name,
    ),
    create_collection_database_error_to_response,
  )

  wisp.ok()
}

pub fn delete(
  _req: Request,
  ctx: Context,
  req_ctx: RequestContext,
  id: String,
) -> Response {
  use file_id <- given.ok(uuid.from_string(id), fn(_) {
    web.json_message_response("Invalid collection id.", 400)
  })

  let res =
    repo.delete_collection_by_id(
      conn: ctx.db,
      id: file_id,
      user_id: req_ctx.session.user_id,
    )

  use _ <- given.ok(res, fn(_) {
    web.json_message_response(
      "Collection doesn't exist or belongs to another user.",
      404,
    )
  })

  wisp.ok()
}
