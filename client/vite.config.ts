import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import {terser} from 'rollup-plugin-terser'// Import terser like this

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  envPrefix: ['VITE_', 'NODE_ENV'],
  plugins: [
    react(),
    tsconfigPaths(),
  ],
  build: {
    minify: isProduction ? 'terser' : false,
    sourcemap: !isProduction,
    terserOptions: isProduction ? {
      compress: {
        drop_console: true,
      },
    } : {},
    rollupOptions: {
      output: {
        manualChunks: isProduction ? {
          vendor: ['react', 'react-dom']
        } : undefined
      },
      plugins: isProduction ? [terser()] : []  // Use the imported terser function
    },
    reportCompressedSize: isProduction,
  },
  base: '/',
});