import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': {
        target: 'http://localhost:54455',
        changeOrigin: true,
      },
      '/user': {
        target: 'http://localhost:54455',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:54455',
        changeOrigin: true,
        secure: false,
        // Фикс для удаления дублирующихся CORS заголовков
        onProxyRes: (proxyRes) => {
          const key = 'access-control-allow-origin';
          if (proxyRes.headers[key]) {
            // Если пришло несколько значений (напр. "*, *"), 
            // принудительно оставляем только одно "*"
            proxyRes.headers[key] = '*'; 
          }
        }
      }
    }
  }
})