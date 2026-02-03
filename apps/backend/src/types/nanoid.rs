use nanoid::nanoid;
use salvo::oapi::ToSchema;
use serde::{self, Deserialize, Serialize};
use sqlx::Type;

pub const ALPHABET: [char; 62] = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i',
    'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B',
    'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U',
    'V', 'W', 'X', 'Y', 'Z',
];

#[derive(PartialEq, Eq, Clone, Debug, Default, Serialize, Deserialize, Type, ToSchema)]
#[sqlx(transparent)]
#[serde(try_from = "String")]
pub struct NanoId(String);

impl NanoId {
    pub fn new(length: usize) -> Self {
        Self(nanoid!(length, &ALPHABET))
    }
}

impl std::fmt::Display for NanoId {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl TryFrom<String> for NanoId {
    type Error = &'static str;

    fn try_from(s: String) -> Result<Self, Self::Error> {
        if s.chars().any(|c| !c.is_ascii_alphanumeric()) {
            return Err("NanoId should only contain ascii alphanumeric characters.");
        }
        Ok(Self(s))
    }
}

impl From<NanoId> for String {
    fn from(id: NanoId) -> Self {
        id.0
    }
}
