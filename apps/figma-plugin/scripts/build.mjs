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

const pluginOptions = {
  ...sharedOptions,
  entryPoints: [join(appDir, 'src/plugin/main.ts')],
  outfile: join(appDir, 'dist/plugin/main.js'),
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
