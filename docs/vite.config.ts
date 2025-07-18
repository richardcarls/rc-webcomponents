import * as fs from 'fs';
import { resolve } from 'path';

import { defineConfig, type Plugin } from 'vite';

function serveFile(url: string, filePath: string): Plugin {
  return {
    name: `serve-file:${url}`,
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== url) return next();
        try {
          const stat = fs.statSync(filePath);
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Content-Length': stat.size,
          });
          fs.createReadStream(filePath).pipe(res);
        } catch {
          res.writeHead(404);
          res.end('Not found');
        }
      });
    },
  };
}

export default defineConfig({
  publicDir: resolve(__dirname, '../demo-shared'),
  plugins: [
    serveFile(
      '/custom-elements.json',
      resolve(__dirname, '../dist/custom-elements.json'),
    ),
  ],
});
