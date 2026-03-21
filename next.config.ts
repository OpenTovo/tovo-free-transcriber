import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  // Allow cross-origin requests from local network devices for development
  allowedDevOrigins: ['192.168.2.*', '192.168.2.*:3006'],

  // Exclude whisper.cpp build files from compilation
  webpack: (config, { isServer }) => {
    // Exclude whisper.cpp build directory and other non-source files
    config.module.rules.push({
      test: /\.(ts|tsx|js|jsx)$/,
      exclude: [/node_modules/, /whisper\.cpp/],
    })

    // Also exclude these from being processed as modules at all
    config.resolve.alias = {
      ...config.resolve.alias,
    }

    // Ignore these files completely
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules/**', '**/whisper.cpp/**'],
    }

    return config
  },
  async headers() {
    return [
      {
        // Apply headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          // Additional headers for mobile browser compatibility
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
          // Ensure service worker can be loaded
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        // Apply headers specifically to WASM files
        source: '/wasm/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },
      {
        // Apply headers specifically to service worker
        source: '/coi-serviceworker.js',
        headers: [
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        // Apply headers specifically to AudioWorklet scripts for offline caching
        source: '/audio-processor/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable, stale-while-revalidate=31536000',
          },
          {
            key: 'Expires',
            value: new Date(Date.now() + 31536000000).toUTCString(),
          },
        ],
      },
    ]
  },
}

export default nextConfig

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'
initOpenNextCloudflareForDev()
