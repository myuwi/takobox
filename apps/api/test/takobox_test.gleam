import gleeunit
import gleeunit/should
import wisp/testing

import app/router

pub fn main() {
  gleeunit.main()
}

pub fn router_test() {
  let response = router.handle_request(testing.get("/", []))

  response.status
  |> should.equal(200)

  response
  |> testing.string_body
  |> should.equal("Hello Takobox API!")
}
