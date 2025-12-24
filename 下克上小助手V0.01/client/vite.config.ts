import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // 使用esbuild进行压缩（内置，无需额外安装）
    minify: 'esbuild',
    // 优化chunk大小
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // 分离vendor chunks以提高缓存效率
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  // 确保简体中文编码正确
  define: {
    __APP_VERSION__: JSON.stringify('1.0.0'),
  },
});
