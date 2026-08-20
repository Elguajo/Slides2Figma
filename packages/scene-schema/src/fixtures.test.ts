import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SceneSchema } from './scene';

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));

function loadFixture(relativePath: string): unknown {
  return JSON.parse(readFileSync(`${repoRoot}fixtures/${relativePath}`, 'utf-8'));
}

describe('hand-authored fixtures conform to SceneSchema (Phase 00 Task 3)', () => {
  it('fixtures/basic/rectangle.json parses as a valid Scene', () => {
    const result = SceneSchema.safeParse(loadFixture('basic/rectangle.json'));
    expect(result.success).toBe(true);
  });

  it('fixtures/text/mixed-text.json parses as a valid Scene', () => {
    const result = SceneSchema.safeParse(loadFixture('text/mixed-text.json'));
    expect(result.success).toBe(true);
  });

  it('fixtures/gradients/linear.json parses as a valid Scene', () => {
    const result = SceneSchema.safeParse(loadFixture('gradients/linear.json'));
    expect(result.success).toBe(true);
  });

  it('fixtures/vector/basic-path.json parses as a valid Scene', () => {
    const result = SceneSchema.safeParse(loadFixture('vector/basic-path.json'));
    expect(result.success).toBe(true);
  });

  it('fixtures/images/basic.json parses as a valid Scene', () => {
    const result = SceneSchema.safeParse(loadFixture('images/basic.json'));
    expect(result.success).toBe(true);
  });

  it('fixtures/groups/basic.json parses as a valid Scene with a nested, non-trivial z-order group', () => {
    const scene = loadFixture('groups/basic.json');
    const result = SceneSchema.safeParse(scene);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const group = result.data.nodes.find((node) => node.type === 'group');
    expect(group?.type).toBe('group');
    if (group?.type !== 'group') return;

    // Array order is deliberately scrambled against zIndex to exercise the
    // renderer's sort-by-zIndex step rather than trusting array order.
    expect(group.children.map((child) => child.zIndex)).not.toEqual(
      [...group.children.map((child) => child.zIndex)].sort((a, b) => a - b),
    );

    const nestedGroup = group.children.find((child) => child.type === 'group');
    expect(nestedGroup?.type).toBe('group');
    if (nestedGroup?.type !== 'group') return;
    expect(nestedGroup.children.some((child) => child.type === 'unsupported')).toBe(true);
  });

  it('fixtures/errors/unsupported-node.json parses as a valid Scene with a surviving sibling and a warning diagnostic', () => {
    const scene = loadFixture('errors/unsupported-node.json');
    const result = SceneSchema.safeParse(scene);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.nodes.some((node) => node.type === 'unsupported')).toBe(true);
    expect(result.data.nodes.some((node) => node.type !== 'unsupported')).toBe(true);
    expect(result.data.diagnostics.some((diagnostic) => diagnostic.severity === 'warning')).toBe(true);
  });
});
