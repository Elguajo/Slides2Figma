import { describe, expect, it } from 'vitest';
import { SceneSchema } from './scene';
import { baseNodeFields } from './test-fixtures';

function validScene() {
  return {
    schemaVersion: '0.1.0',
    source: {
      app: 'google-slides' as const,
      presentationId: 'pres-1',
      slideId: 'slide-1',
      title: 'Test Slide',
    },
    canvas: { width: 1920, height: 1080, unit: 'source' as const },
    nodes: [
      {
        ...baseNodeFields({ id: 'rect-1' }),
        type: 'rectangle' as const,
        fill: [{ type: 'solid' as const, color: { r: 1, g: 0, b: 0, a: 1 } }],
      },
      {
        ...baseNodeFields({ id: 'unsupported-1' }),
        type: 'unsupported' as const,
        sourceType: 'wordart',
        reason: 'WordArt is not yet supported',
      },
    ],
    assets: [],
    diagnostics: [
      { severity: 'warning' as const, code: 'unsupported-node', message: 'WordArt converted to placeholder', nodeId: 'unsupported-1' },
    ],
  };
}

describe('SceneSchema', () => {
  it('accepts a well-formed scene (malformed fixture JSON should fail validation, not crash the plugin — Technical Spec §36/§58)', () => {
    const result = SceneSchema.safeParse(validScene());
    expect(result.success).toBe(true);
  });

  it('rejects a scene with a wrong source.app literal', () => {
    const scene = validScene();
    const result = SceneSchema.safeParse({ ...scene, source: { ...scene.source, app: 'powerpoint' } });
    expect(result.success).toBe(false);
  });

  it('rejects a scene with a non-positive canvas dimension', () => {
    const scene = validScene();
    const result = SceneSchema.safeParse({ ...scene, canvas: { ...scene.canvas, width: 0 } });
    expect(result.success).toBe(false);
  });

  it('rejects a scene whose nodes contain an invalid node', () => {
    const scene = validScene();
    const result = SceneSchema.safeParse({ ...scene, nodes: [{ id: 'bad', type: 'rectangle' }] });
    expect(result.success).toBe(false);
  });

  it('rejects a scene missing the diagnostics array', () => {
    const scene = validScene() as Record<string, unknown>;
    const { diagnostics: _diagnostics, ...withoutDiagnostics } = scene;
    const result = SceneSchema.safeParse(withoutDiagnostics);
    expect(result.success).toBe(false);
  });
});
