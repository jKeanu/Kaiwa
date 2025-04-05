import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import terser from '@rollup/plugin-terser';


export default defineConfig(({mode})=>{    
  const isProduction = mode === 'production'
  return ({
    plugins: [
      react()
    ],
    resolve: {
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.d.ts'],
    },
    build: {
      target: 'esnext',
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
            vendor: ['react', 'react-dom', 'axios', 'lodash.throttle']
          } : undefined
        },
        plugins: isProduction ? [terser()] : []
      },
      reportCompressedSize: isProduction,
    },
    server: {
      strictPort: true,
      open: true, 
      cors: true,
    }
})});