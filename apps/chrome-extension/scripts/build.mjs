import { build, context } from 'esbuild';
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = dirname(dirname(fileURLToPath(import.meta.url)));
const watch = process.argv.includes('--watch');

const sharedOptions = {
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  logLevel: 'info',
};

const entries = {
  'background/service-worker': join(appDir, 'src/background/service-worker.ts'),
  'content/bridge': join(appDir, 'src/content/bridge.ts'),
  'content/ui': join(appDir, 'src/content/ui.ts'),
  'injected/main-world': join(appDir, 'src/injected/main-world.ts'),
};

const buildOptionsFor = (name) => ({
  ...sharedOptions,
  entryPoints: [entries[name]],
  outfile: join(appDir, `dist/${name}.js`),
});

function copyManifest() {
  mkdirSync(join(appDir, 'dist'), { recursive: true });
  copyFileSync(join(appDir, 'manifest.json'), join(appDir, 'dist/manifest.json'));
}

if (watch) {
  const contexts = await Promise.all(Object.keys(entries).map((name) => context(buildOptionsFor(name))));
  copyManifest();
  await Promise.all(contexts.map((ctx) => ctx.watch()));
  console.log('[chrome-extension] watching for changes (background + content + injected)…');
} else {
  await Promise.all(Object.keys(entries).map((name) => build(buildOptionsFor(name))));
  copyManifest();
  console.log('[chrome-extension] build complete -> dist/{background,content,injected}/*.js, dist/manifest.json');
}
