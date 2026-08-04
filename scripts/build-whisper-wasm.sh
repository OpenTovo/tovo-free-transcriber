#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

WHISPER_VERSION="${WHISPER_VERSION:-v1.9.1}"
WHISPER_COMMIT="${WHISPER_COMMIT:-f049fff95a089aa9969deb009cdd4892b3e74916}"
EMSCRIPTEN_VERSION="${EMSCRIPTEN_VERSION:-4.0.23}"
EMSDK_DIR="${EMSDK_DIR:-$REPO_ROOT/../emsdk}"
BUILD_ROOT="${WHISPER_BUILD_ROOT:-$REPO_ROOT/.build/whisper}"

SOURCE_DIR="$BUILD_ROOT/source-$WHISPER_VERSION"
BUILD_DIR="$BUILD_ROOT/build-$WHISPER_VERSION"
OUTPUT_PATH="$BUILD_DIR/bin/libmain.js"
PUBLIC_PATH="$REPO_ROOT/public/wasm/whisper.js"

die() {
  echo "error: $*" >&2
  exit 1
}

if [[ "$EMSDK_DIR" != /* ]]; then
  EMSDK_DIR="$REPO_ROOT/$EMSDK_DIR"
fi

[[ -x "$EMSDK_DIR/emsdk" ]] || die "EMSDK not found at $EMSDK_DIR"

EMSDK_QUIET=1 source "$EMSDK_DIR/emsdk_env.sh" >/dev/null
emcc_version="$(emcc --version | sed -n '1p')"
[[ "$emcc_version" == *"$EMSCRIPTEN_VERSION"* ]] || die \
  "Found $emcc_version; expected Emscripten $EMSCRIPTEN_VERSION"

if [[ ! -d "$SOURCE_DIR/.git" ]]; then
  mkdir -p "$BUILD_ROOT"
  git clone --branch "$WHISPER_VERSION" --depth 1 \
    https://github.com/ggml-org/whisper.cpp.git \
    "$SOURCE_DIR"
fi

actual_commit="$(git -C "$SOURCE_DIR" rev-parse HEAD)"
[[ "$actual_commit" == "$WHISPER_COMMIT" ]] || die \
  "$WHISPER_VERSION resolved to $actual_commit; expected $WHISPER_COMMIT"

rm -rf "$BUILD_DIR"

emcmake cmake \
  -S "$SOURCE_DIR" \
  -B "$BUILD_DIR" \
  -DCMAKE_BUILD_TYPE=Release \
  -DWHISPER_BUILD_TESTS=OFF \
  -DWHISPER_BUILD_EXAMPLES=ON \
  -DWHISPER_WASM_SINGLE_FILE=ON

cmake --build "$BUILD_DIR" --target libmain --parallel "${BUILD_JOBS:-4}"

[[ -f "$OUTPUT_PATH" ]] || die "Build artifact missing: $OUTPUT_PATH"
cp "$OUTPUT_PATH" "$PUBLIC_PATH"

echo "Built whisper.cpp $WHISPER_VERSION with Emscripten $EMSCRIPTEN_VERSION"
echo "Installed browser runtime: $PUBLIC_PATH"
ls -lh "$PUBLIC_PATH"
shasum -a 256 "$PUBLIC_PATH"
