# Maintenance scripts

- `build-whisper-wasm.sh` builds the pinned official whisper.cpp release and
  installs the generated single-file runtime at `public/wasm/whisper.js`.
- `upload-to-r2.sh` downloads the existing quantized Whisper models and uploads
  them to the configured Cloudflare R2 bucket. Uploads are always a manual step.

See [`docs/whisper-wasm-build.md`](../docs/whisper-wasm-build.md) for the full
build and verification workflow.
