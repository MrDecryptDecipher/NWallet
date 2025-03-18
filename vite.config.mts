import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';

// Define the configuration
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tsconfigPaths(),
    NodeGlobalsPolyfillPlugin({
      buffer: true,
      process: true
    })
  ],
  base: '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      buffer: 'buffer/',
      process: 'process/browser',
      stream: 'stream-browserify',
      zlib: 'browserify-zlib',
      util: 'util/',
      path: 'path-browserify'
    }
  },
  define: {
    'process.env': process.env,
    global: 'globalThis',
    '__LIT_PROD__': mode === 'production',
    'process.env.NODE_ENV': JSON.stringify(mode)
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    },
    include: [
      '@web3modal/wagmi',
      '@web3modal/ethereum',
      'wagmi',
      'viem',
      'buffer',
      'process',
      'util',
      'stream-browserify'
    ]
  },
  // Add TypeScript options to bypass checking
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: true,
    hmr: {
      clientPort: 5174
    },
    fs: {
      strict: false
    }
  },
  preview: {
    port: 5174,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  }
}));