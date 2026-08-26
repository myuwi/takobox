use std::{
    ffi::OsStr,
    path::Path,
    process::{ExitStatus, Stdio},
};

use tokio::process::Command;

pub enum ThumbnailError {
    UnsupportedFiletype,
    ShellError(tokio::io::Error),
    CommandFailed { status: ExitStatus, stderr: String },
}

const IMAGE_EXTENSIONS: [&str; 7] = ["avif", "png", "jpg", "jpeg", "gif", "webp", "svg"];
const VIDEO_EXTENSIONS: [&str; 3] = ["mp4", "webm", "mkv"];

pub fn thumbnail_file_name(filename: &str) -> Option<String> {
    let (stem, ext) = filename.rsplit_once('.')?;

    if !IMAGE_EXTENSIONS.contains(&ext) && !VIDEO_EXTENSIONS.contains(&ext) {
        return None;
    }

    Some(stem.to_owned() + ".avif")
}

pub async fn generate_thumbnail(
    input_file_path: &Path,
    output_dir: &Path,
) -> Result<(), ThumbnailError> {
    let thumb_file_name = input_file_path
        .file_name()
        .and_then(OsStr::to_str)
        .and_then(thumbnail_file_name)
        .ok_or(ThumbnailError::UnsupportedFiletype)?;

    let thumb_path = output_dir.join(&thumb_file_name);

    let output = Command::new("ffmpeg")
        .args(["-nostdin", "-hide_banner"])
        .args([OsStr::new("-i"), input_file_path.as_os_str()])
        .args(["-vf", "scale=256:-1"])
        .args(["-c:v", "libsvtav1"])
        .args(["-frames:v", "1"])
        .arg(&thumb_path)
        .stdin(Stdio::null())
        .output()
        .await
        .map_err(ThumbnailError::ShellError)?;

    if !output.status.success() {
        let _ = tokio::fs::remove_file(&thumb_path).await;

        return Err(ThumbnailError::CommandFailed {
            status: output.status,
            stderr: String::from_utf8_lossy(&output.stderr).trim().to_owned(),
        });
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use std::io::Write;

    use super::*;

    #[tokio::test]
    async fn reports_ffmpeg_failure_and_removes_partial_output() {
        let dir = tempfile::tempdir().unwrap();
        let input = dir.path().join("broken.png");

        let mut f = std::fs::File::create(&input).unwrap();
        f.write_all(b"\x89PNG\r\n\x1a\n").unwrap();
        f.write_all(&[0u8; 2000]).unwrap();
        drop(f);

        let result = generate_thumbnail(&input, dir.path()).await;

        match result {
            Err(ThumbnailError::CommandFailed { status, .. }) => {
                assert!(!status.success());
            }
            Err(ThumbnailError::UnsupportedFiletype) => panic!("png should be supported"),
            Err(ThumbnailError::ShellError(e)) => panic!("spawn failed: {e}"),
            Ok(()) => panic!("expected failure, got Ok"),
        }

        assert!(!dir.path().join("broken.avif").exists());
    }
}
