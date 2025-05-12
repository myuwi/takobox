import gleam/http
import gleam/http/cookie
import gleam/http/request
import gleam/http/response
import gleam/list
import gleam/option.{Some}
import wisp.{type Request, type Response}

import app/context.{type Context, Production}

pub fn set_cookie(
  response: Response,
  ctx: Context,
  name: String,
  value: String,
  max_age: Int,
) -> Response {
  let secure = ctx.env == Production

  let cookie_attributes =
    cookie.Attributes(
      ..cookie.defaults(case secure {
        False -> http.Http
        True -> http.Https
      }),
      max_age: Some(max_age),
    )

  response
  |> response.set_cookie(name, value, cookie_attributes)
}

pub fn get_cookie(request: Request, name: String) -> Result(String, Nil) {
  request
  |> request.get_cookies
  |> list.key_find(name)
}
