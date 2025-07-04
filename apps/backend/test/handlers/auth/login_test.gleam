import gleam/http/response
import gleam/result
import gleeunit/should
import wisp/testing

import app/model/auth_payload.{AuthPayload, encode_auth_payload}
import app/repo/repo
import app/router
import test_support.{with_context}

pub fn succeeds_with_valid_credentials_test() {
  use ctx <- with_context()

  let assert Ok(_) = repo.create_user(ctx.db, "test", "password")

  let payload =
    AuthPayload(username: "test", password: "password")
    |> encode_auth_payload()

  let response =
    router.handle_request(testing.post_json("/auth/login", [], payload), ctx)

  response.status
  |> should.equal(200)

  response
  |> response.get_header("set-cookie")
  |> result.try(fn(cookie) {
    case cookie {
      "session=" <> _ -> Ok(Nil)
      _ -> Error(Nil)
    }
  })
  |> should.be_ok()
}
