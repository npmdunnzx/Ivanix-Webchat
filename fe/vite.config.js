import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  publicDir: false,
  plugins: [
    react(),
    {
      name: "public-index",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const pathname = req.url?.split("?")[0];
          const isAppRoute =
            pathname &&
            !pathname.includes(".") &&
            !pathname.startsWith("/@") &&
            !pathname.startsWith("/src/") &&
            !pathname.startsWith("/node_modules/");

          if (pathname === "/" || pathname === "/index.html" || isAppRoute) {
            req.url = "/public/index.html";
          }

          next();
        });
      },
      generateBundle(_options, bundle) {
        const html = bundle["public/index.html"];

        if (html) {
          html.fileName = "index.html";
          bundle["index.html"] = html;
          delete bundle["public/index.html"];
        }
      },
    },
  ],
  server: {
    host: "localhost",
    port: 3000,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        index: "public/index.html",
      },
    },
  },
});
