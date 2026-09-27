import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // rutas relativas: necesario cuando esto se empaquete para Android (file://)
  build: {
    target: 'es2019', // cobertura amplia de WebViews Android sin transpilar de más
    sourcemap: true,
  },
  server: {
    host: true, // permite probar desde el celular en la misma red (vite --host)
  },
});
