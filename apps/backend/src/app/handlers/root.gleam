import wisp.{type Request, type Response}

import app/context.{type Context}

pub fn index(_req: Request, _ctx: Context) -> Response {
  wisp.ok()
  |> wisp.string_body("Hello Takobox API!")
}
