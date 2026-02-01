import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dts({ 
        include: ['src'],
        insertTypesEntry: true
    })
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'NexusPayReact',
      formats: ['es', 'umd'],
      fileName: (format) => `nexuspay-react.${format}.js`
    },
    rollupOptions: {
      external: [
        'react', 
        'react-dom', 
        'wagmi', 
        'viem', 
        '@tanstack/react-query'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          wagmi: 'wagmi',
          viem: 'viem',
          '@tanstack/react-query': 'ReactQuery'
        }
      }
    }
  }
})
