export { RGBASchema, type RGBA } from './color';
export { Transform2DSchema, type Transform2D } from './transform';

export {
  FillSchema,
  SolidFillSchema,
  LinearGradientFillSchema,
  RadialGradientFillSchema,
  GradientStopSchema,
  type Fill,
  type SolidFill,
  type LinearGradientFill,
  type RadialGradientFill,
  type GradientStop,
} from './fill';

export { StrokeSchema, type Stroke } from './stroke';
export { DiagnosticSchema, type Diagnostic } from './diagnostic';
export { AssetSchema, type Asset } from './asset';

export {
  TextRunSchema,
  ParagraphStyleSchema,
  TextSceneNodeSchema,
  type TextRun,
  type ParagraphStyle,
  type TextSceneNode,
} from './nodes/text';

export { RectangleNodeSchema, type RectangleNode } from './nodes/rectangle';
export { EllipseNodeSchema, type EllipseNode } from './nodes/ellipse';
export { VectorSceneNodeSchema, type VectorSceneNode } from './nodes/vector';
export { ImageSceneNodeSchema, type ImageSceneNode } from './nodes/image';
export { UnsupportedNodeSchema, type UnsupportedNode } from './nodes/unsupported';

export {
  SceneNodeSchema,
  GroupNodeSchema,
  type SceneNode,
  type SceneNodeBase,
  type GroupNode,
} from './scene-node';

export { SceneSchema, type Scene } from './scene';
