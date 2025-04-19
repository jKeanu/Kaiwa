import { defineConfig } from 'vite';
import { sentryVitePlugin } from "@sentry/vite-plugin"
import react from '@vitejs/plugin-react';
import terser from '@rollup/plugin-terser';

export default defineConfig(({ mode }) => {
    const isProduction = mode === 'production';
    return {
        plugins: [
            react(),
            isProduction?
            sentryVitePlugin({
                authToken: process.env.SENTRY_AUTH_TOKEN,
                org: process.env.SENTRY_ORG,
                project: process.env.SENTRY_PROJECT,
                sourcemaps: {
                    assets: "./dist/**",
                    filesToDeleteAfterUpload: './dist/**/*.map',
                }
            }):
            null
        ],
        resolve: {
            extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.d.ts'],
        },
        build: {
            target: 'esnext',
            minify: isProduction ? 'terser' : false,
            sourcemap: true,
            terserOptions: isProduction
                ? {
                      compress: {
                          drop_console: true,
                      },
                  }
                : {},
            rollupOptions: {
                output: {
                    manualChunks: isProduction
                        ? {
                              vendor: ['react', 'react-dom', 'axios', 'lodash.throttle'],
                          }
                        : undefined,
                },
                plugins: isProduction ? [terser()] : [],
            },
            reportCompressedSize: isProduction,
        },
        server: {
            strictPort: true,
            open: true,
            cors: true,
        },
    };
});
