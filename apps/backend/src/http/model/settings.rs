use serde::Serialize;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub max_file_size: usize,
}

// TODO: Make this actually configurable
impl Default for Settings {
    fn default() -> Self {
        Self {
            max_file_size: 32_000_000,
        }
    }
}
