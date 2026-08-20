import rectangleFixture from '../../../../fixtures/basic/rectangle.json';
import mixedTextFixture from '../../../../fixtures/text/mixed-text.json';
import linearGradientFixture from '../../../../fixtures/gradients/linear.json';
import basicVectorFixture from '../../../../fixtures/vector/basic-path.json';
import basicImageFixture from '../../../../fixtures/images/basic.json';
import basicGroupFixture from '../../../../fixtures/groups/basic.json';
import unsupportedNodeFixture from '../../../../fixtures/errors/unsupported-node.json';

export interface FixtureEntry {
  id: string;
  label: string;
  scene: unknown;
}

export const FIXTURES: FixtureEntry[] = [
  { id: 'basic/rectangle', label: 'Basic — rectangles', scene: rectangleFixture },
  { id: 'text/mixed-text', label: 'Text — mixed styling', scene: mixedTextFixture },
  { id: 'gradients/linear', label: 'Gradients — linear', scene: linearGradientFixture },
  { id: 'vector/basic-path', label: 'Vector — basic path', scene: basicVectorFixture },
  { id: 'images/basic', label: 'Images — full-bleed', scene: basicImageFixture },
  { id: 'groups/basic', label: 'Groups — nested, rotated, z-order', scene: basicGroupFixture },
  { id: 'errors/unsupported-node', label: 'Errors — unsupported node', scene: unsupportedNodeFixture },
];
