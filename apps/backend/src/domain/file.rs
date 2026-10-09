use std::{ffi::OsStr, fmt, path::Path};

use salvo::oapi::ToSchema;
use sanitize_filename::is_sanitized;
use serde::{Deserialize, Serialize};
use sqlx::Type;

use super::id;

/// The public id of a file.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, Type, ToSchema)]
#[salvo(schema(name = FileId))]
#[serde(transparent)]
#[sqlx(transparent)]
pub struct FileId(String);

impl FileId {
    pub fn generate(length: usize) -> Self {
        Self(id::generate(length))
    }
}

impl fmt::Display for FileId {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        f.write_str(&self.0)
    }
}

#[derive(Debug)]
pub struct FileName(String);

impl FileName {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<String> for FileName {
    type Error = &'static str;

    fn try_from(s: String) -> Result<Self, Self::Error> {
        let trimmed = s.trim();

        if trimmed.is_empty() {
            return Err("File name must not be empty.");
        }

        if !is_sanitized(trimmed) {
            return Err("File name contains invalid characters.");
        }

        Ok(Self(trimmed.to_owned()))
    }
}

pub struct FileRename(FileName);

impl FileRename {
    pub fn new(filename: &str, name: FileName) -> Result<Self, &'static str> {
        fn extension(name: &str) -> Option<&str> {
            Path::new(name).extension().and_then(OsStr::to_str)
        }

        if extension(name.as_str()) != extension(filename) {
            return Err("New file extension must match the old one.");
        }

        Ok(Self(name))
    }

    pub fn name(&self) -> &FileName {
        &self.0
    }
}
