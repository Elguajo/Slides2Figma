import { z } from 'zod';
import { sceneNodeBaseShape } from '../node-base';
import { FillSchema } from '../fill';

/** Ranges are UTF-16 code unit offsets, not visual glyph counts (Technical Spec §17). */
export const TextRunSchema = z
  .object({
    start: z.number().int().nonnegative(),
    end: z.number().int().nonnegative(),

    fontFamily: z.string().optional(),
    fontStyle: z.string().optional(),

    fontSize: z.number().positive().optional(),
    fontWeight: z.number().optional(),

    fill: FillSchema.optional(),

    bold: z.boolean().optional(),
    italic: z.boolean().optional(),
    underline: z.boolean().optional(),
    strikethrough: z.boolean().optional(),

    letterSpacing: z.number().optional(),
    baselineShift: z.number().optional(),

    link: z.string().optional(),
  })
  .refine((run) => run.end >= run.start, {
    message: 'TextRun.end must be >= start',
    path: ['end'],
  });

export type TextRun = z.infer<typeof TextRunSchema>;

export const ParagraphStyleSchema = z
  .object({
    start: z.number().int().nonnegative(),
    end: z.number().int().nonnegative(),

    align: z.enum(['left', 'center', 'right', 'justify']).optional(),

    lineHeight: z.number().positive().optional(),

    spaceBefore: z.number().optional(),
    spaceAfter: z.number().optional(),

    indentLeft: z.number().optional(),
    indentRight: z.number().optional(),

    direction: z.enum(['ltr', 'rtl']).optional(),
  })
  .refine((paragraph) => paragraph.end >= paragraph.start, {
    message: 'ParagraphStyle.end must be >= start',
    path: ['end'],
  });

export type ParagraphStyle = z.infer<typeof ParagraphStyleSchema>;

export const TextSceneNodeSchema = z.object({
  ...sceneNodeBaseShape,
  type: z.literal('text'),

  text: z.string(),

  box: z.object({
    width: z.number(),
    height: z.number(),
  }),

  runs: z.array(TextRunSchema),
  paragraphs: z.array(ParagraphStyleSchema),
});

export type TextSceneNode = z.infer<typeof TextSceneNodeSchema>;
