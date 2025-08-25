use std::{ffi::OsStr, path::Path};

use tokio::process::Command;

use crate::THUMBS_PATH;

pub enum ThumbnailError {
    UnsupportedFiletype,
    ShellError(tokio::io::Error),
}

const IMAGE_EXTENSIONS: [&str; 6] = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
const VIDEO_EXTENSIONS: [&str; 3] = ["mp4", "webm", "mkv"];

pub async fn generate_thumbnail(file_path: &str) -> Result<String, ThumbnailError> {
    let (file_id, ext) = Path::new(file_path)
        .file_name()
        .and_then(OsStr::to_str)
        .and_then(|s| s.rsplit_once('.'))
        .ok_or(ThumbnailError::UnsupportedFiletype)?;

    if !IMAGE_EXTENSIONS.contains(&ext) && !VIDEO_EXTENSIONS.contains(&ext) {
        return Err(ThumbnailError::UnsupportedFiletype);
    }

    let thumb_file_name = file_id.to_owned() + ".webp";
    let thumb_path = format!("{}/{}", THUMBS_PATH, &thumb_file_name);

    Command::new("ffmpeg")
        .args([
            "-i",
            file_path,
            "-vf",
            "scale=256:-1",
            "-c:v",
            "libwebp",
            "-frames:v",
            "1",
            &thumb_path,
        ])
        .output()
        .await
        .map_err(ThumbnailError::ShellError)?;

    Ok(thumb_file_name)
}
