import { build, context } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = dirname(dirname(fileURLToPath(import.meta.url)));
const watch = process.argv.includes('--watch');

const uiTemplate = readFileSync(join(appDir, 'src/ui/index.html'), 'utf8');

function writeUiHtml(js) {
  const inlined = js.replace(/<\/script>/g, '<\\/script>');
  const html = uiTemplate.replace('/*__UI_SCRIPT__*/', inlined);
  mkdirSync(join(appDir, 'dist/ui'), { recursive: true });
  writeFileSync(join(appDir, 'dist/ui/index.html'), html);
}

const sharedOptions = {
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2017',
  logLevel: 'info',
};

/**
 * Figma's web plugin sandbox (unlike desktop, and unlike the UI iframe) runs
 * plugin code in a restricted realm with no working `BigInt` global. zod's
 * core module unconditionally evaluates `BigInt(...)` at import time to
 * build its int64/uint64 range table (`BIGINT_FORMAT_RANGES`), even though
 * this codebase never uses `z.bigint()`/int64 schemas -- that throws
 * "BigInt is not a function" before the plugin can even call
 * `figma.showUI`. Shimming a non-throwing (imprecise) `BigInt` is safe here
 * specifically because no schema in this repo relies on real bigint
 * precision; scoped to the plugin bundle only via banner (runs before any
 * bundled code, including zod's) since the UI iframe has a real `BigInt`.
 */
const bigIntShimBanner = `if (typeof globalThis.BigInt !== 'function') { globalThis.BigInt = function (v) { return Number(v); }; }`;

const pluginOptions = {
  ...sharedOptions,
  entryPoints: [join(appDir, 'src/plugin/main.ts')],
  outfile: join(appDir, 'dist/plugin/main.js'),
  banner: { js: bigIntShimBanner },
};

const uiOptions = {
  ...sharedOptions,
  entryPoints: [join(appDir, 'src/ui/main.ts')],
  write: false,
};

if (watch) {
  const pluginCtx = await context(pluginOptions);
  const uiCtx = await context({
    ...uiOptions,
    plugins: [
      {
        name: 'inline-ui-html',
        setup(pluginBuild) {
          pluginBuild.onEnd((result) => {
            const output = result.outputFiles?.[0];
            if (output) {
              writeUiHtml(output.text);
            }
          });
        },
      },
    ],
  });
  await Promise.all([pluginCtx.watch(), uiCtx.watch()]);
  console.log('[figma-plugin] watching for changes (plugin + ui)…');
} else {
  const [, uiResult] = await Promise.all([build(pluginOptions), build(uiOptions)]);
  writeUiHtml(uiResult.outputFiles[0].text);
  console.log('[figma-plugin] build complete -> dist/plugin/main.js, dist/ui/index.html');
}
