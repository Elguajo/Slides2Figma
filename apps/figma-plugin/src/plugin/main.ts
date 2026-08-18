import { SceneSchema } from '@slides2figma/scene-schema';
import { renderScene } from '@slides2figma/figma-renderer';

interface RenderFixtureMessage {
  type: 'render-fixture';
  scene: unknown;
}

figma.showUI(__html__, { width: 320, height: 380 });

figma.ui.onmessage = (message: RenderFixtureMessage) => {
  if (!message || message.type !== 'render-fixture') {
    return;
  }

  const parsed = SceneSchema.safeParse(message.scene);
  if (!parsed.success) {
    const summary = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    figma.notify(`Invalid scene: ${summary}`, { error: true });
    figma.ui.postMessage({ type: 'render-error', message: summary });
    return;
  }

  const { diagnostics } = renderScene(parsed.data);

  figma.notify(
    diagnostics.length > 0 ? `Rendered with ${diagnostics.length} diagnostic(s)` : 'Rendered',
  );
  figma.ui.postMessage({ type: 'render-result', diagnostics });
};
