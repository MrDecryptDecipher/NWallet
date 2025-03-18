// vite.config.mts
import { defineConfig } from "file:///home/ubuntu/Sandeep/projects/Nwallet/node_modules/vite/dist/node/index.js";
import react from "file:///home/ubuntu/Sandeep/projects/Nwallet/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { resolve } from "path";
import tsconfigPaths from "file:///home/ubuntu/Sandeep/projects/Nwallet/node_modules/vite-tsconfig-paths/dist/index.mjs";
import { NodeGlobalsPolyfillPlugin } from "file:///home/ubuntu/Sandeep/projects/Nwallet/node_modules/@esbuild-plugins/node-globals-polyfill/dist/index.js";
var __vite_injected_original_dirname = "/home/ubuntu/Sandeep/projects/Nwallet";
var vite_config_default = defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tsconfigPaths(),
    NodeGlobalsPolyfillPlugin({
      buffer: true,
      process: true
    })
  ],
  base: "./",
  resolve: {
    alias: {
      "@": resolve(__vite_injected_original_dirname, "src"),
      buffer: "buffer",
      process: "process/browser",
      stream: "readable-stream",
      zlib: "browserify-zlib",
      util: "util"
    }
  },
  define: {
    "process.env": {},
    global: "globalThis",
    "__LIT_PROD__": mode === "production",
    "process.env.NODE_ENV": JSON.stringify(mode)
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis"
      }
    },
    include: [
      "@web3modal/wagmi",
      "@web3modal/ethereum",
      "wagmi",
      "viem"
    ]
  },
  // Add TypeScript options to bypass checking
  esbuild: {
    logOverride: { "this-is-undefined-in-esm": "silent" }
  },
  server: {
    host: "0.0.0.0",
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
    outDir: "dist",
    sourcemap: true,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvdWJ1bnR1L1NhbmRlZXAvcHJvamVjdHMvTndhbGxldFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvdWJ1bnR1L1NhbmRlZXAvcHJvamVjdHMvTndhbGxldC92aXRlLmNvbmZpZy5tdHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvdWJ1bnR1L1NhbmRlZXAvcHJvamVjdHMvTndhbGxldC92aXRlLmNvbmZpZy5tdHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgdHNjb25maWdQYXRocyBmcm9tICd2aXRlLXRzY29uZmlnLXBhdGhzJztcbmltcG9ydCB7IE5vZGVHbG9iYWxzUG9seWZpbGxQbHVnaW4gfSBmcm9tICdAZXNidWlsZC1wbHVnaW5zL25vZGUtZ2xvYmFscy1wb2x5ZmlsbCc7XG5cbi8vIERlZmluZSB0aGUgY29uZmlndXJhdGlvblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgdHNjb25maWdQYXRocygpLFxuICAgIE5vZGVHbG9iYWxzUG9seWZpbGxQbHVnaW4oe1xuICAgICAgYnVmZmVyOiB0cnVlLFxuICAgICAgcHJvY2VzczogdHJ1ZVxuICAgIH0pXG4gIF0sXG4gIGJhc2U6ICcuLycsXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYycpLFxuICAgICAgYnVmZmVyOiAnYnVmZmVyJyxcbiAgICAgIHByb2Nlc3M6ICdwcm9jZXNzL2Jyb3dzZXInLFxuICAgICAgc3RyZWFtOiAncmVhZGFibGUtc3RyZWFtJyxcbiAgICAgIHpsaWI6ICdicm93c2VyaWZ5LXpsaWInLFxuICAgICAgdXRpbDogJ3V0aWwnXG4gICAgfVxuICB9LFxuICBkZWZpbmU6IHtcbiAgICAncHJvY2Vzcy5lbnYnOiB7fSxcbiAgICBnbG9iYWw6ICdnbG9iYWxUaGlzJyxcbiAgICAnX19MSVRfUFJPRF9fJzogbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nLFxuICAgICdwcm9jZXNzLmVudi5OT0RFX0VOVic6IEpTT04uc3RyaW5naWZ5KG1vZGUpXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGVzYnVpbGRPcHRpb25zOiB7XG4gICAgICBkZWZpbmU6IHtcbiAgICAgICAgZ2xvYmFsOiAnZ2xvYmFsVGhpcydcbiAgICAgIH1cbiAgICB9LFxuICAgIGluY2x1ZGU6IFtcbiAgICAgICdAd2ViM21vZGFsL3dhZ21pJyxcbiAgICAgICdAd2ViM21vZGFsL2V0aGVyZXVtJyxcbiAgICAgICd3YWdtaScsXG4gICAgICAndmllbSdcbiAgICBdXG4gIH0sXG4gIC8vIEFkZCBUeXBlU2NyaXB0IG9wdGlvbnMgdG8gYnlwYXNzIGNoZWNraW5nXG4gIGVzYnVpbGQ6IHtcbiAgICBsb2dPdmVycmlkZTogeyAndGhpcy1pcy11bmRlZmluZWQtaW4tZXNtJzogJ3NpbGVudCcgfVxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiAnMC4wLjAuMCcsXG4gICAgcG9ydDogNTE3NCxcbiAgICBzdHJpY3RQb3J0OiB0cnVlLFxuICAgIGhtcjoge1xuICAgICAgY2xpZW50UG9ydDogNTE3NFxuICAgIH0sXG4gICAgZnM6IHtcbiAgICAgIHN0cmljdDogZmFsc2VcbiAgICB9XG4gIH0sXG4gIHByZXZpZXc6IHtcbiAgICBwb3J0OiA1MTc0LFxuICAgIHN0cmljdFBvcnQ6IHRydWVcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgY29tbW9uanNPcHRpb25zOiB7XG4gICAgICBpbmNsdWRlOiBbL25vZGVfbW9kdWxlcy9dLFxuICAgICAgdHJhbnNmb3JtTWl4ZWRFc01vZHVsZXM6IHRydWVcbiAgICB9XG4gIH1cbn0pKTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQW1TLFNBQVMsb0JBQW9CO0FBQ2hVLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFDeEIsT0FBTyxtQkFBbUI7QUFDMUIsU0FBUyxpQ0FBaUM7QUFKMUMsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixjQUFjO0FBQUEsSUFDZCwwQkFBMEI7QUFBQSxNQUN4QixRQUFRO0FBQUEsTUFDUixTQUFTO0FBQUEsSUFDWCxDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsTUFBTTtBQUFBLEVBQ04sU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxRQUFRLGtDQUFXLEtBQUs7QUFBQSxNQUM3QixRQUFRO0FBQUEsTUFDUixTQUFTO0FBQUEsTUFDVCxRQUFRO0FBQUEsTUFDUixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsSUFDUjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLGVBQWUsQ0FBQztBQUFBLElBQ2hCLFFBQVE7QUFBQSxJQUNSLGdCQUFnQixTQUFTO0FBQUEsSUFDekIsd0JBQXdCLEtBQUssVUFBVSxJQUFJO0FBQUEsRUFDN0M7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLGdCQUFnQjtBQUFBLE1BQ2QsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLE1BQ1Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUVBLFNBQVM7QUFBQSxJQUNQLGFBQWEsRUFBRSw0QkFBNEIsU0FBUztBQUFBLEVBQ3REO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsSUFDWixLQUFLO0FBQUEsTUFDSCxZQUFZO0FBQUEsSUFDZDtBQUFBLElBQ0EsSUFBSTtBQUFBLE1BQ0YsUUFBUTtBQUFBLElBQ1Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsRUFDZDtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsaUJBQWlCO0FBQUEsTUFDZixTQUFTLENBQUMsY0FBYztBQUFBLE1BQ3hCLHlCQUF5QjtBQUFBLElBQzNCO0FBQUEsRUFDRjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
