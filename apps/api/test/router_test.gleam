import gleeunit/should
import wisp/testing

import app/router
import test_support.{with_context}

pub fn router_test() {
  use ctx <- with_context()

  let response = router.handle_request(testing.get("/", []), ctx)

  response.status
  |> should.equal(200)

  response
  |> testing.string_body
  |> should.equal("Hello Takobox API!")
}
