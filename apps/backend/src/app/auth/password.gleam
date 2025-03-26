import antigone
import gleam/bit_array

pub fn hash_password(password: String) -> String {
  password
  |> bit_array.from_string
  |> antigone.hash(antigone.hasher(), _)
}

pub fn verify_password(password: String, password_hash: String) -> Bool {
  password
  |> bit_array.from_string
  |> antigone.verify(password_hash)
}
