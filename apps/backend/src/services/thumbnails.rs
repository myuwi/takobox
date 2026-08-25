use std::{ffi::OsStr, path::Path, process::Stdio};

use tokio::process::Command;

pub enum ThumbnailError {
    UnsupportedFiletype,
    ShellError(tokio::io::Error),
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
) -> Result<String, ThumbnailError> {
    let thumb_file_name = input_file_path
        .file_name()
        .and_then(OsStr::to_str)
        .and_then(thumbnail_file_name)
        .ok_or(ThumbnailError::UnsupportedFiletype)?;

    let thumb_path = output_dir.join(&thumb_file_name);

    Command::new("ffmpeg")
        .args(["-nostdin", "-hide_banner"])
        .args([OsStr::new("-i"), input_file_path.as_os_str()])
        .args(["-vf", "scale=256:-1"])
        .args(["-c:v", "libaom-av1"])
        .args(["-frames:v", "1"])
        .arg(thumb_path)
        .stdin(Stdio::null())
        .output()
        .await
        .map_err(ThumbnailError::ShellError)?;

    Ok(thumb_file_name)
}
