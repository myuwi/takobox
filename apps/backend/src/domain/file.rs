use std::{ffi::OsStr, path::Path};

use sanitize_filename::is_sanitized;

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
