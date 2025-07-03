import gleam/json
import gleeunit/should
import wisp.{Empty}
import wisp/testing

import app/model/user
import app/router
import test_support.{with_context, with_session}

pub fn succeeds_with_valid_session_test() {
  use ctx <- with_context()
  use session <- with_session(ctx)

  let req =
    testing.get("/me", [])
    |> wisp.set_secret_key_base(ctx.secret)
    |> testing.set_cookie("session", session, wisp.Signed)

  let response = router.handle_request(req, ctx)

  response.status
  |> should.equal(200)

  response
  |> testing.string_body
  |> json.parse(user.user_decoder())
  |> should.be_ok()

  Nil
}

pub fn fails_without_session_test() {
  use ctx <- with_context()

  let response = router.handle_request(testing.get("/me", []), ctx)

  response.status
  |> should.equal(401)

  response.body
  |> should.equal(Empty)

  Nil
}
