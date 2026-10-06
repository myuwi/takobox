use std::path::{Path, PathBuf};

use anyhow::Context;
use tokio::fs;

#[derive(Clone, Debug)]
pub struct Directories {
    data_dir: PathBuf,
    uploads_dir: PathBuf,
    thumbs_dir: PathBuf,
    tmp_dir: PathBuf,
}

impl Directories {
    pub fn new(data_dir: impl AsRef<Path>) -> Self {
        let data_dir = data_dir.as_ref();

        Self {
            data_dir: data_dir.to_owned(),
            uploads_dir: data_dir.join("uploads"),
            thumbs_dir: data_dir.join("thumbs"),
            tmp_dir: data_dir.join("tmp"),
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

    pub fn tmp_dir(&self) -> &Path {
        self.tmp_dir.as_path()
    }

    pub async fn create_all(&self) -> anyhow::Result<()> {
        for dir in [self.uploads_dir(), self.thumbs_dir(), self.tmp_dir()] {
            fs::create_dir_all(dir)
                .await
                .with_context(|| format!("failed to create {}", dir.display()))?;
        }
        Ok(())
    }

    /// Empties the tmp dir, which only holds uploads that never finished.
    pub async fn clear_tmp_dir(&self) -> anyhow::Result<()> {
        let dir = self.tmp_dir();
        fs::remove_dir_all(dir)
            .await
            .with_context(|| format!("failed to clear {}", dir.display()))?;
        fs::create_dir(dir)
            .await
            .with_context(|| format!("failed to create {}", dir.display()))
    }
}
