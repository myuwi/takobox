use serde::{self, Deserialize, Serialize};
use sqlx::{
    Decode, Encode, Sqlite, Type,
    encode::IsNull,
    error::BoxDynError,
    sqlite::{SqliteArgumentValue, SqliteTypeInfo, SqliteValueRef},
};

/// A wrapper for the `uuid::Uuid` type to store it as a hyphenated String.
#[derive(PartialEq, Copy, Eq, Clone, Debug, Default, Serialize, Deserialize)]
pub struct Uuid(uuid::Uuid);

impl Uuid {
    pub fn new() -> Self {
        Self(uuid::Uuid::new_v4())
    }
}

impl std::fmt::Display for Uuid {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "{}", self.0.hyphenated())
    }
}

impl TryFrom<String> for Uuid {
    type Error = uuid::Error;

    fn try_from(s: String) -> Result<Self, uuid::Error> {
        uuid::Uuid::try_from(s).map(Self)
    }
}

impl From<Uuid> for String {
    fn from(uuid: Uuid) -> Self {
        uuid.to_string()
    }
}

impl From<Uuid> for uuid::Uuid {
    fn from(uuid: Uuid) -> Self {
        uuid.0
    }
}

impl Type<Sqlite> for Uuid {
    fn type_info() -> SqliteTypeInfo {
        <uuid::fmt::Hyphenated as sqlx::Type<Sqlite>>::type_info()
    }
}

impl<'q> Encode<'q, Sqlite> for Uuid {
    fn encode_by_ref(
        &self,
        args: &mut Vec<SqliteArgumentValue<'q>>,
    ) -> Result<IsNull, BoxDynError> {
        <uuid::fmt::Hyphenated as Encode<Sqlite>>::encode_by_ref(&self.0.hyphenated(), args)
    }
}

impl Decode<'_, Sqlite> for Uuid {
    fn decode(value: SqliteValueRef<'_>) -> Result<Self, BoxDynError> {
        <uuid::fmt::Hyphenated as Decode<Sqlite>>::decode(value).map(|uuid| Self(uuid.into_uuid()))
    }
}
