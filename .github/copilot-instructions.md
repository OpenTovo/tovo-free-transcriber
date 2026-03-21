# AI Coding Instructions

## Project Overview

This is **TOVO Free Transcriber** - a browser-based audio/video transcription app using whisper.cpp WASM. It runs entirely client-side with no backend, deployed on Cloudflare Pages.

## Architecture Understanding

### Core Components

- **`/app`**: Next.js 15 App Router pages (`layout.tsx`, `page.tsx`)
- **`/components`**: React components using Radix UI + Tailwind CSS
  - `transcription-interface.tsx` - Main UI orchestrator
  - `file-upload.tsx` - Handles audio/video file selection with format validation
  - `transcription-results.tsx` - Real-time results display
  - `/ui` - shadcn/ui component library
- **`/lib`**: Core business logic
  - `whisper-wasm.ts` - WASM module loader and transcription engine
  - `whisper-models.ts` - Model management (download, storage, chunking)
  - `idb.ts` - IndexedDB wrapper for model storage
  - `atoms.ts` - Jotai state management

### WASM Integration Architecture

The app integrates **whisper.cpp** as a git submodule in `/whisper.cpp/`. Key points:

- Uses pre-compiled WASM files in `/public/wasm/` (whisper.js, whisper.wasm)
- Cross-origin isolation required for SharedArrayBuffer threading
- Models stored locally in IndexedDB with 50MB chunking
- Real-time transcription via print callbacks from WASM

### Deployment Stack

- **Runtime**: Next.js → OpenNext.js → Cloudflare Pages
- **Build**: `opennextjs-cloudflare` converts Next.js to Cloudflare Workers
- **Static Assets**: Served via Cloudflare with cross-origin headers
- **Environment Variables**: Configured in `wrangler.jsonc` for Cloudflare

## Development Workflows

### Key Commands

```bash
# Development (requires HTTPS for SharedArrayBuffer)
npm run dev          # HTTPS with certs
npm run dev:http     # HTTP fallback

# Deployment
npm run deploy       # Build + deploy to Cloudflare
npm run preview      # Local preview of Cloudflare build

# Type generation for Cloudflare
npm run cf-typegen   # Updates cloudflare-env.d.ts
```

### Build Configuration Gotchas

- **Next.js excludes whisper.cpp**: `next.config.ts` has webpack rules to ignore `/whisper.cpp/` build files
- **Cross-origin headers**: Required in both `next.config.ts` (Next.js) and `public/_headers` (Cloudflare)
- **ESLint warnings**: Configured in `eslint.config.mjs` to use warnings instead of errors for development velocity

## Project-Specific Patterns

### File Processing Pipeline

1. **Upload** → `file-upload.tsx` validates formats (audio/video MIME types)
2. **Convert** → `audioFileToFloat32Array()` converts to 16kHz Float32Array
3. **Model Loading** → `whisperModelManager` handles download/chunking to IndexedDB
4. **Transcription** → `WhisperWASM.transcribe()` processes with real-time callbacks
5. **Results** → Progressive display via `onProgress` callbacks

### State Management Pattern

Uses **Jotai** atoms (`/lib/atoms.ts`) for app-level state, local React state for component-level:

```typescript
// Prefer local state for component-specific data
const [transcriptionState, setTranscriptionState] = useState<TranscriptionState>('idle')

// Use Jotai for cross-component state (if needed)
```

### Cross-Origin Requirements

Critical for WASM threading - missing these breaks the app:

```typescript
// next.config.ts
'Cross-Origin-Opener-Policy': 'same-origin',
'Cross-Origin-Embedder-Policy': 'require-corp'

// public/_headers (Cloudflare Pages)
Cross-Origin-Resource-Policy: cross-origin
```

### Model Management Pattern

Models are downloaded once, stored in IndexedDB with chunking:

```typescript
// Always check if model exists before downloading
const isDownloaded = await whisperModelManager.isModelDownloaded(modelKey)
if (!isDownloaded) {
  await whisperModelManager.downloadModel(modelKey, onProgress)
}
```

## Debugging Workflows

### WASM Threading Issues

- Check browser console for SharedArrayBuffer availability
- Verify cross-origin headers are applied (Network tab)
- Test with `PTHREAD_POOL_SIZE: 0` to disable threading if needed

### Model Download Problems

- Inspect IndexedDB in DevTools (Application tab)
- Check R2 URL in network requests (`NEXT_PUBLIC_R2_BASE_URL`)
- Verify chunking logic if models fail to load

### Cloudflare Deployment Issues

- Use `npm run cf-typegen` after env changes
- Check `wrangler.jsonc` environment variables
- Verify `public/_headers` syntax (no trailing spaces)

## Integration Points

### External Dependencies

- **Cloudflare R2**: Model storage at `https://whisper-models.tovo.dev`
- **whisper.cpp**: Git submodule, pre-compiled WASM binaries
- **IndexedDB**: Client-side model and chunk storage
- **AudioContext**: Browser audio processing API

### Component Communication

- `transcription-interface.tsx` orchestrates the entire flow
- Real-time updates via callback props: `onProgress={(result) => setTranscriptionResult(result)}`
- Error handling with toast notifications using `sonner`

## Critical Files to Understand

- `/components/transcription-interface.tsx` - Main app logic
- `/lib/whisper-wasm.ts` - WASM integration
- `/lib/whisper-models.ts` - Model management
- `/next.config.ts` - Build and CORS configuration
- `/wrangler.jsonc` - Cloudflare deployment settings
- `/public/_headers` - Static asset headers

## Development Guidelines

- **Always test with HTTPS locally** (`npm run dev`) for SharedArrayBuffer
- **Model downloads are cached** - delete IndexedDB data to re-test
- **Build exclusions are critical** - don't modify whisper.cpp webpack ignores
- **Type safety** - Use provided TypeScript interfaces for WASM methods
- **Error boundaries** - Wrap WASM operations in try/catch with user feedback
