use sanitize_filename::is_sanitized;

#[derive(Clone, Debug)]
pub struct FileName(String);

impl AsRef<str> for FileName {
    fn as_ref(&self) -> &str {
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
