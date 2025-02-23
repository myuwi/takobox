import birl
import gwt.{type Jwt, type JwtDecodeError, type Verified}

const exp_days = 30

pub fn decode_jwt(
  token: String,
  secret: String,
) -> Result(Jwt(Verified), JwtDecodeError) {
  gwt.from_signed_string(token, secret)
}

pub fn create_jwt(id: String, secret: String) -> String {
  let issued_at = birl.to_unix(birl.now())
  let expiration = issued_at + exp_days * 86_400

  gwt.new()
  |> gwt.set_subject(id)
  |> gwt.set_issued_at(issued_at)
  |> gwt.set_expiration(expiration)
  |> gwt.to_signed_string(gwt.HS256, secret)
}
