import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {defineConfig} from 'vite';
import {EMBEDDED_PRODUCTION_ASSETS} from './src/generated/embeddedAssets.ts';

const ROOT_DIR =
  typeof import.meta.dirname === 'string'
    ? import.meta.dirname
    : path.dirname(fileURLToPath(import.meta.url));

function ensurePublicAssetsExist(rootDir: string) {
  const publicDir = path.resolve(rootDir, 'public');
  for (const [relUrl, entry] of Object.entries(EMBEDDED_PRODUCTION_ASSETS)) {
    const cleanRel = relUrl.replace(/^\/+/, '');
    const targetPath = path.join(publicDir, cleanRel);
    if (!fs.existsSync(targetPath) || fs.statSync(targetPath).size === 0) {
      fs.mkdirSync(path.dirname(targetPath), {recursive: true});
      fs.writeFileSync(targetPath, Buffer.from(entry.b64, 'base64'));
    }
  }
  // Ensure /assets/hero/tooth.mp4 exists if /tooth.mp4 exists
  const rootTooth = path.join(publicDir, 'tooth.mp4');
  const heroTooth = path.join(publicDir, 'assets', 'hero', 'tooth.mp4');
  if (fs.existsSync(rootTooth) && !fs.existsSync(heroTooth)) {
    fs.mkdirSync(path.dirname(heroTooth), {recursive: true});
    fs.copyFileSync(rootTooth, heroTooth);
  } else if (fs.existsSync(heroTooth) && !fs.existsSync(rootTooth)) {
    fs.copyFileSync(heroTooth, rootTooth);
  }
}

export default defineConfig(() => {
  const productionAssetPlugin = {
    name: 'memon-production-assets',
    buildStart() {
      ensurePublicAssetsExist(ROOT_DIR);
    },
    configureServer(server: {
      middlewares: {
        use: (
          fn: (
            req: {url?: string},
            res: {setHeader: (k: string, v: string) => void},
            next: () => void
          ) => void
        ) => void;
      };
    }) {
      ensurePublicAssetsExist(ROOT_DIR);
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.endsWith('.mp4')) {
          res.setHeader('Content-Type', 'video/mp4');
        }
        next();
      });
    },
  };

  return {
    plugins: [productionAssetPlugin, react(), tailwindcss()],
    build: {
      assetsDir: '_bundle',
      chunkSizeWarningLimit: 2500,
    },
    resolve: {
      alias: {
        '@': path.resolve(ROOT_DIR, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

