#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
R2_BUCKET="${R2_BUCKET:-whisper-models}"
R2_PREFIX="${R2_PREFIX:-quantized}"
MODELS_DIR="${MODELS_DIR:-$REPO_ROOT/scripts/models/temp}"
WRANGLER="${WRANGLER:-$REPO_ROOT/node_modules/.bin/wrangler}"

model_url() {
  case "$1" in
    tiny) echo "https://whisper.ggerganov.com/ggml-model-whisper-tiny-q5_1.bin" ;;
    base) echo "https://whisper.ggerganov.com/ggml-model-whisper-base-q5_1.bin" ;;
    small) echo "https://whisper.ggerganov.com/ggml-model-whisper-small-q5_1.bin" ;;
    *) return 1 ;;
  esac
}

model_sha256() {
  case "$1" in
    tiny) echo "818710568da3ca15689e31a743197b520007872ff9576237bda97bd1b469c3d7" ;;
    base) echo "422f1ae452ade6f30a004d7e5c6a43195e4433bc370bf23fac9cc591f01a8898" ;;
    small) echo "ae85e4a935d7a567bd102fe55afc16bb595bdb618e11b2fc7591bc08120411bb" ;;
    *) return 1 ;;
  esac
}

upload_model() {
  local model="$1"
  local url
  local expected_sha256
  local file
  local actual_sha256

  url="$(model_url "$model")" || {
    echo "error: unknown model '$model' (expected tiny, base, small, or all)" >&2
    exit 2
  }
  expected_sha256="$(model_sha256 "$model")"
  file="$MODELS_DIR/ggml-$model-q5_1.bin"

  mkdir -p "$MODELS_DIR"
  if [[ ! -f "$file" ]]; then
    curl -fL --retry 3 -o "$file" "$url"
  fi

  actual_sha256="$(shasum -a 256 "$file" | awk '{print $1}')"
  [[ "$actual_sha256" == "$expected_sha256" ]] || {
    echo "error: checksum mismatch for $file" >&2
    exit 1
  }

  "$WRANGLER" r2 object put \
    "$R2_BUCKET/$R2_PREFIX/$(basename "$file")" \
    --file="$file" \
    --remote \
    --content-type="application/octet-stream"
}

[[ -x "$WRANGLER" ]] || {
  echo "error: Wrangler not found at $WRANGLER; run pnpm install first" >&2
  exit 1
}

case "${1:-}" in
  tiny | base | small)
    upload_model "$1"
    ;;
  all)
    for model in tiny base small; do
      upload_model "$model"
    done
    ;;
  *)
    echo "Usage: $0 {tiny|base|small|all}" >&2
    exit 2
    ;;
esac
