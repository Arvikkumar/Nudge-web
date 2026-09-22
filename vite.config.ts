import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envDir: './src',
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    watch: {
      ignored: [
        '**/.env*',
        '**/.gradle/**',
        '**/build/**',
        '**/app/build/**',
        '**/.git/**',
        '**/.aistudio/**',
        '**/*.bin',
      ],
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
  },
});
