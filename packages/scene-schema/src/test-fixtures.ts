import type { Transform2D } from './transform';
import type { SceneNodeBase } from './scene-node';

export const validTransform: Transform2D = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  rotation: 0,
};

/** Minimal valid SceneNodeBase fields, spread into a concrete node fixture and overridden per test. */
export function baseNodeFields(overrides: Partial<SceneNodeBase> = {}): SceneNodeBase {
  return {
    id: 'node-1',
    visible: true,
    zIndex: 0,
    transform: validTransform,
    opacity: 1,
    ...overrides,
  };
}
