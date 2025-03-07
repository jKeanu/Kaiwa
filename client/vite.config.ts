import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import terser from '@rollup/plugin-terser';
import path from 'path';


export default defineConfig(({mode})=>{    
  const isProduction = mode === 'production'
  return ({
  plugins: [
    //plugin that Vite uses to add support for React. 
    //It handles things like compiling JSX (React components) into 
    //regular JavaScript code that browsers can understand.
    react()
  ],
  //configuration option that controls how modules are resolved when Vite 
  //tries to find and load them during bundling or development.
  //determines how to look for and resolve dependencies
  resolve: {
    //define custom shortcuts for importing files, making your imports cleaner and shorter.
    alias: {
      //'@': path.resolve(__dirname, 'src') creates a shortcut so that when you import something, 
      //you can use @ to represent the src directory import MyComponent from '@/components/MyComponent'
      '@': path.resolve(__dirname, 'src'), // Shorter import paths
    },
  },
  build: {
    //This setting tells Vite to minify your code using the terser tool. 
    //Minifying means removing extra spaces, comments, and shortening variable names 
    //to make the code smaller and faster to load.
    target: 'esnext',
    minify: isProduction ? 'terser' : false,
    sourcemap: !isProduction,
    terserOptions: isProduction ? {
      compress: {
        //it's telling Terser to remove all console statements from the code.
        drop_console: true,
      },
    } : {},
    //Rollup is a tool used to bundle JavaScript files
    //configuration option that lets you control how Rollup works behind the scenes when 
    //it bundles your application.
    //after Rollup bundles the files, Terser minifies them to reduce size.
    //rollupOptions modifies how the bundling happens, but the bundling itself 
    //is already happening because Vite uses Rollup internally.
    rollupOptions: {
      output: {
        //Libraries like react and lodash don't change often, so once they're bundled into a 
        //separate vendor chunk, browsers can cache that file long-term.
        //When users navigate between pages, the vendor chunk is already cached, 
        //so only the specific page or route's code will need to be downloaded, improving subsequent page loads.
        //This means these libraries will be loaded separately, which helps browsers cache them, making your app 
        //faster when users visit again
        manualChunks: isProduction ? {
          vendor: ['react', 'react-dom', 'axios', 'lodash.throttle']
        } : undefined
      },
      plugins: isProduction ? [terser()] : []  //This tells Vite to use the terser plugin to minify the code
    },
    //This tells Vite whether or not to show the size of your minified 
    //(compressed) files after building for production. If it's production, 
    //it will report the file sizes; otherwise, it won't.
    reportCompressedSize: isProduction,
  },
  // esbuild: {
  //   define: {
  //     'process.env.NODE_ENV': JSON.stringify(mode), // Helps with tree-shaking
  //   }
  // },
  server: {
    //Ensures the development server uses a specific port
    strictPort: true,
    //Opens the app in your default web browser when the development server starts.
    open: true, 
    //This allows requests from your frontend, to different origins during development
    cors: true, // Allow cross-origin requests
  }
})});