import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // Use environment variable for API proxy target, fallback to localhost for development
    // In production, if VITE_API_URL is not set, use localhost since Express runs on same machine
    const backendPort = env.PORT || '3001';
    const apiTarget = env.VITE_API_URL || `http://localhost:${backendPort}`;

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: ['ajunsmachine.theworkpc.com'],
        proxy: {
          '/api': {
            target: apiTarget,
            changeOrigin: true,
            secure: false,
            configure: (proxy, _options) => {
              proxy.on('error', (err, req, _res) => {
                console.error('Proxy error:', err.message);
                console.log('Failed proxy request:', req.method, req.url, 'to', apiTarget);
              });
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                console.log('Proxying request:', req.method, req.url, 'to', apiTarget);
              });
            },
          },
        },
      },
      preview: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: ['ajunsmachine.theworkpc.com'],
        proxy: {
          '/api': {
            target: apiTarget,
            changeOrigin: true,
            secure: false,
            ws: false,
            configure: (proxy, _options) => {
              proxy.on('error', (err, req, res) => {
                console.error('Preview proxy error:', err.message);
                console.error('Failed to proxy:', req.method, req.url, 'to', apiTarget);
                if (!res.headersSent) {
                  res.writeHead(500, {
                    'Content-Type': 'application/json',
                  });
                  res.end(JSON.stringify({
                    error: 'Proxy error: ' + err.message,
                    hint: `Ensure the API at ${apiTarget} is reachable`
                  }));
                }
              });
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                console.log('Proxying:', req.method, req.url, '→', apiTarget);
              });
              proxy.on('proxyRes', (proxyRes, req, _res) => {
                console.log('Proxy response:', req.method, req.url, '→', proxyRes.statusCode);
              });
            },
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GROQ_API_KEY || env.GEMINI_API_KEY),
        'process.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      optimizeDeps: {
        esbuildOptions: {
          target: 'es2022'
        }
      },
      build: {
        target: ['es2022', 'chrome89', 'edge89', 'firefox89', 'safari15']
      }
    };
});
