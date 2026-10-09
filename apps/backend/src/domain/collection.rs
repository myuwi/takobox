use std::fmt;

use salvo::oapi::ToSchema;
use serde::{Deserialize, Serialize};
use sqlx::Type;

use super::id;

/// The public id of a collection.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, Type, ToSchema)]
#[salvo(schema(name = CollectionId))]
#[serde(transparent)]
#[sqlx(transparent)]
pub struct CollectionId(String);

impl CollectionId {
    pub fn generate(length: usize) -> Self {
        Self(id::generate(length))
    }
}

impl fmt::Display for CollectionId {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        f.write_str(&self.0)
    }
}

#[derive(Debug)]
pub struct CollectionName(String);

impl CollectionName {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<String> for CollectionName {
    type Error = &'static str;

    fn try_from(s: String) -> Result<Self, Self::Error> {
        let trimmed = s.trim();

        if trimmed.is_empty() {
            return Err("Collection name must not be empty.");
        }

        Ok(Self(trimmed.to_owned()))
    }
}
