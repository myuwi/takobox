use std::{ffi::OsStr, path::Path};

use sanitize_filename::is_sanitized;

use crate::db::files::File;

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

impl File {
    pub fn parse_rename(&self, new: FileName) -> Result<RenameTo, &'static str> {
        fn extension(name: &str) -> Option<&str> {
            Path::new(name).extension().and_then(OsStr::to_str)
        }

        if extension(new.as_str()) != extension(&self.filename) {
            return Err("New file extension must match the old one.");
        }

        Ok(RenameTo(new))
    }
}

pub struct RenameTo(FileName);

impl RenameTo {
    pub fn as_str(&self) -> &str {
        self.0.as_str()
    }
}
