import filepath
import gleam/result
import shellout

import app/context.{type Context}
import app/util/files.{Image, Video}

pub type ThumbnailError {
  UnsupportedFiletype
  ShellError(code: Int, message: String)
}

fn create_static_thumbnail(
  input_path: String,
  output_path: String,
) -> Result(String, #(Int, String)) {
  shellout.command(
    run: "ffmpeg",
    with: [
      "-i",
      input_path,
      "-vf",
      "scale=256:-1",
      "-c:v",
      "libwebp",
      "-frames:v",
      "1",
      output_path,
    ],
    in: ".",
    opt: [],
  )
}

pub fn create_thumbnail(
  file_path: String,
  ctx: Context,
) -> Result(String, ThumbnailError) {
  use media_type <- result.try(
    file_path
    |> filepath.extension()
    |> result.try(files.media_type_from_ext)
    |> result.replace_error(UnsupportedFiletype),
  )

  let file_id =
    file_path
    |> filepath.base_name()
    |> filepath.strip_extension()

  let output_path = filepath.join(ctx.thumbs_path, file_id <> ".webp")

  case media_type {
    Image | Video -> create_static_thumbnail(file_path, output_path)
  }
  |> result.replace(output_path)
  |> result.map_error(fn(e) { ShellError(code: e.0, message: e.1) })
}
