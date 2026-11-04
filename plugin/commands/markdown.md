---
description: Convert an HTML file or HTML text to GitHub Flavored Markdown locally, with its images as files beside the Markdown.
argument-hint: "[--out <file.md>] [--download-images] [--browser] <path to an .html file, or the HTML text>"
---

Convert HTML to Markdown from: $ARGUMENTS

1. Read the arguments. `--out <file.md>` sets the output Markdown file. `--download-images` fetches remote images. `--browser` uses a headless browser for the conversion. The rest is the path of an `.html` file or the HTML text. When the input is missing, ask for it and stop.
2. Choose the output path:
   - With `--out`, use that path. It must end in `.md`.
   - Without `--out`, use the input file name with the extension `.md`, in the same folder. For HTML text, use `converted.md` in the folder `./diagrams`. Create the folder when it does not exist.
   - Never overwrite a file. When the name exists, add `-2`, `-3` and so on.
3. Call `html_to_markdown`:
   - For a file, set `input_path` to the file path. For HTML text, set `html` to the text.
   - Set `output_path` to the output path.
   - Set `download_images` to true only when `--download-images` is given.
   - Set `browser` to true only when `--browser` is given.
4. Read the result. A result with `"status":"error"` is a failure. Report the error code. Check that the Markdown file exists and that its size is more than 0.
5. Privacy: the conversion runs on this machine through the sciengjs engine. No source leaves the machine. With `--download-images`, the engine fetches each remote image, and it does so only when the engine config allows images. Without that flag, the conversion makes no network request. Tell the user when a fetch happened.
6. Report to the user:
   - The full path of the Markdown file.
   - Each asset path in `assets`. Each asset is an image file beside the Markdown.
   - Each item in `warnings`.
