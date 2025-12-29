// src/main.tsx
import 'buffer';
import { Buffer } from 'buffer';

// Polyfill Buffer for Solana and other web3 libs
if (!window.Buffer) {
  window.Buffer = Buffer;
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './globals.css'
import { QueryProvider } from './providers/QueryProvider';
import { ErrorBoundary } from 'react-error-boundary';

// Simple error fallback
function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="bg-gray-800 p-6 rounded-lg max-w-lg w-full">
        <h2 className="text-xl font-bold text-red-500 mb-2">Something went wrong:</h2>
        <pre className="text-sm bg-gray-900 p-4 rounded overflow-auto mb-4">{error.message}</pre>
        <button 
          onClick={resetErrorBoundary}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryProvider>
        <App />
      </QueryProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
