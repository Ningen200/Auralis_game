import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths are required when the built app is bundled inside Capacitor.
  base: './',
  build: {
    target: 'es2020',
    sourcemap: false
  }
});
