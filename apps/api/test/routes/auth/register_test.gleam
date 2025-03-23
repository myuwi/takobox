import app/model/auth_payload.{AuthPayload, encode_auth_payload}
import gleam/json
import gleeunit/should
import wisp/testing

import app/model/token.{token_decoder}
import app/router
import test_support.{with_context}

pub fn register_test() {
  use ctx <- with_context()

  let payload =
    AuthPayload(username: "test", password: "password")
    |> encode_auth_payload()

  let response =
    router.handle_request(testing.post_json("/auth/register", [], payload), ctx)

  response.status
  |> should.equal(201)

  response
  |> testing.string_body
  |> json.parse(token_decoder())
  |> should.be_ok()

  Nil
}
