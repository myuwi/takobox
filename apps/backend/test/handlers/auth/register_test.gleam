import gleam/http/response
import gleam/list
import gleam/result
import gleeunit/should
import wisp/testing

import app/model/auth_payload.{AuthPayload, encode_auth_payload}
import app/router
import test_support.{with_context}

pub fn succeeds_with_valid_credentials_test() {
  use ctx <- with_context()

  let payload =
    AuthPayload(username: "test", password: "password")
    |> encode_auth_payload()

  let response =
    router.handle_request(testing.post_json("/auth/register", [], payload), ctx)

  response.status
  |> should.equal(201)

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

pub fn fails_with_invalid_username_test() {
  use ctx <- with_context()

  let invalid_usernames = ["asd", "test*", "more_than_32_characters_long_name"]

  invalid_usernames
  |> list.each(fn(username) {
    let payload =
      AuthPayload(username:, password: "password")
      |> encode_auth_payload()

    let response =
      router.handle_request(
        testing.post_json("/auth/register", [], payload),
        ctx,
      )

    response.status
    |> should.equal(400)
  })

  Nil
}

pub fn fails_with_invalid_password_test() {
  use ctx <- with_context()

  let invalid_passwords = ["passw", "more_than_32_characters_long_pass"]

  invalid_passwords
  |> list.each(fn(password) {
    let payload =
      AuthPayload(username: "test", password:)
      |> encode_auth_payload()

    let response =
      router.handle_request(
        testing.post_json("/auth/register", [], payload),
        ctx,
      )

    response.status
    |> should.equal(400)
  })

  Nil
}
