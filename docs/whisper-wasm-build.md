# Whisper WebAssembly build

Tovo Free Transcriber uses Whisper locally in the browser. The application
commits the generated single-file WebAssembly runtime at
`public/wasm/whisper.js`; it does not require a whisper.cpp Git submodule at
development or runtime.

## Pinned toolchain

The repository build script pins:

- official whisper.cpp `v1.9.1`
- the exact upstream tag commit
- Emscripten `4.0.23`

The script builds upstream's `libmain` target. That target exports the `init`,
`free`, and `full_default` functions used by `lib/whisper-wasm.ts` and embeds
the `.wasm` payload in the generated JavaScript file.

## Prepare EMSDK

Install EMSDK anywhere outside this repository. For example, if the checkout
is beside the project:

```bash
EMSDK_DIR="../emsdk"
"$EMSDK_DIR/emsdk" install 4.0.23
"$EMSDK_DIR/emsdk" activate 4.0.23
```

The build script activates the SDK itself and refuses a different compiler
version so the checked-in artifact remains reproducible.

## Rebuild

From the repository root:

```bash
EMSDK_DIR="../emsdk" ./scripts/build-whisper-wasm.sh
```

Source and intermediate output are stored under the ignored `.build/whisper/`
directory. A successful build replaces `public/wasm/whisper.js` and prints its
size and SHA-256 checksum.

Review that generated diff, then run:

```bash
pnpm check:ci
pnpm build
```

The existing Whisper model files do not need to be rebuilt or uploaded when
only the WebAssembly runtime changes. They remain compatible with the upstream
runtime.

## Model uploads

Model uploads are manual and separate from the runtime build:

```bash
./scripts/upload-to-r2.sh tiny
./scripts/upload-to-r2.sh base
./scripts/upload-to-r2.sh small
```

The helper uses the repository's Wrangler dependency. It must only be run by a
maintainer authenticated to the intended Cloudflare account.

## Updating whisper.cpp later

Before changing `WHISPER_VERSION` and `WHISPER_COMMIT` in the build script:

1. Read the upstream release notes.
2. Confirm `examples/whisper.wasm` still builds `libmain` and exports the API
   used by `lib/whisper-wasm.ts`.
3. Rebuild with the documented Emscripten version.
4. Test model download, model initialization, recording, and transcription in
   a browser with cross-origin isolation enabled.

Upstream source and releases:

- <https://github.com/ggml-org/whisper.cpp>
- <https://github.com/ggml-org/whisper.cpp/releases>
