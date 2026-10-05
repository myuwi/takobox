use std::path::{Path, PathBuf};

use anyhow::Context;
use tokio::fs;

#[derive(Clone, Debug)]
pub struct Directories {
    data_dir: PathBuf,
    uploads_dir: PathBuf,
    thumbs_dir: PathBuf,
}

impl Directories {
    pub fn new(data_dir: impl AsRef<Path>) -> Self {
        let data_dir = data_dir.as_ref();

        Self {
            data_dir: data_dir.to_owned(),
            uploads_dir: data_dir.join("uploads"),
            thumbs_dir: data_dir.join("thumbs"),
        }
    }

    pub fn data_dir(&self) -> &Path {
        self.data_dir.as_path()
    }

    pub fn uploads_dir(&self) -> &Path {
        self.uploads_dir.as_path()
    }

    pub fn thumbs_dir(&self) -> &Path {
        self.thumbs_dir.as_path()
    }

    pub async fn create_all(&self) -> anyhow::Result<()> {
        for dir in [self.uploads_dir(), self.thumbs_dir()] {
            fs::create_dir_all(dir)
                .await
                .with_context(|| format!("failed to create {}", dir.display()))?;
        }
        Ok(())
    }
}
