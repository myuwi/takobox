use std::{io, path::Path};

use anyhow::Context;
use nanoid::nanoid;
use takobox::SessionSecret;
use tokio::{fs, io::AsyncWriteExt};
use tracing::info;

const FILE_NAME: &str = "session-secret";
const LENGTH: usize = 64;

pub async fn load_or_create(data_dir: &Path) -> anyhow::Result<SessionSecret> {
    let path = data_dir.join(FILE_NAME);

    match fs::read_to_string(&path).await {
        Ok(secret) => {
            return SessionSecret::try_from(secret.trim()).with_context(|| {
                format!(
                    "{} is invalid; delete it to generate a new one",
                    path.display()
                )
            });
        }
        Err(err) if err.kind() != io::ErrorKind::NotFound => return Err(err.into()),
        Err(_) => {}
    }

    let secret = nanoid!(LENGTH);
    let mut file = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .mode(0o600)
        .open(&path)
        .await?;
    file.write_all(secret.as_bytes()).await?;
    file.sync_all().await?;
    info!(path = %path.display(), "generated a new session secret");

    SessionSecret::try_from(secret.as_str())
}

#[cfg(test)]
mod tests {
    use std::os::unix::fs::PermissionsExt;

    use super::*;

    #[tokio::test]
    async fn generates_the_secret_once_and_reuses_it() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join(FILE_NAME);

        load_or_create(dir.path()).await.unwrap();
        let stored = std::fs::read_to_string(&path).unwrap();
        load_or_create(dir.path()).await.unwrap();

        assert_eq!(stored.len(), LENGTH);
        assert_eq!(std::fs::read_to_string(&path).unwrap(), stored);
    }

    #[tokio::test]
    async fn stores_the_secret_readable_only_by_its_owner() {
        let dir = tempfile::tempdir().unwrap();

        load_or_create(dir.path()).await.unwrap();

        let mode = std::fs::metadata(dir.path().join(FILE_NAME))
            .unwrap()
            .permissions()
            .mode();
        assert_eq!(mode & 0o777, 0o600);
    }

    #[tokio::test]
    async fn rejects_an_invalid_secret_without_replacing_it() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join(FILE_NAME);
        std::fs::write(&path, "").unwrap();

        assert!(load_or_create(dir.path()).await.is_err());
        assert_eq!(std::fs::read_to_string(&path).unwrap(), "");
    }
}
