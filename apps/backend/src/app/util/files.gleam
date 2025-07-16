import gleam/bool
import gleam/list

pub type MediaType {
  Image
  Video
}

pub const image_extensions = ["png", "jpg", "jpeg", "gif", "webp", "svg"]

pub const video_extensions = ["mp4", "webm", "mkv"]

pub fn media_type_from_ext(ext: String) -> Result(MediaType, Nil) {
  use <- bool.guard(list.contains(image_extensions, ext), Ok(Image))
  use <- bool.guard(list.contains(video_extensions, ext), Ok(Video))

  Error(Nil)
}
