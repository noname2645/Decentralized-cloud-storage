import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: path.resolve('./node_modules/react'),
      '@': path.resolve(__dirname, './src') // Add path aliases for cleaner imports
    },
    extensions: ['.js', '.jsx', '.json'] // Auto-resolve these extensions
  },
  build: {
    outDir: '../dist', // Build output directory
    emptyOutDir: true, // Clear the directory before build
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html') // Entry point
      }
    }
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true, // Needed for Docker
    hmr: {
      clientPort: 443 // Important for Render.com
    }
  },
  preview: {
    port: 3000,
    strictPort: true
  }
});