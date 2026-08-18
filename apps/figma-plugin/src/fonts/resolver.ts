import type { FontQuery, FontResolver, ResolvedFont } from '@slides2figma/figma-renderer';

/** `Inter` ships with every Figma document/font list and is always loadable -- the last-resort fallback. */
const DEFAULT_FONT: FontName = { family: 'Inter', style: 'Regular' };

/**
 * Font availability/mapping lives here per Architecture.md's "Sources of
 * truth" table, not in `packages/figma-renderer` -- the renderer only knows
 * about the `FontResolver` interface it calls into (Task 6).
 *
 * Fallback order for a requested (family, weight/bold/italic):
 * 1. exact family + resolved style
 * 2. same family, "Regular" style (family exists, requested variant doesn't)
 * 3. `Inter`, resolved style (family missing entirely, keep bold/italic intent)
 * 4. `Inter Regular` (always available)
 */
export const pluginFontResolver: FontResolver = {
  async resolveFont(query: FontQuery): Promise<ResolvedFont> {
    const requestedFamily = query.fontFamily ?? DEFAULT_FONT.family;
    const requestedStyle = styleNameFor(query);
    const requested: FontName = { family: requestedFamily, style: requestedStyle };

    if (await tryLoad(requested)) {
      return { fontName: requested, fallback: false };
    }

    if (requestedStyle !== 'Regular') {
      const familyRegular: FontName = { family: requestedFamily, style: 'Regular' };
      if (await tryLoad(familyRegular)) {
        return { fontName: familyRegular, fallback: true };
      }
    }

    const fallbackFamilyStyled: FontName = { family: DEFAULT_FONT.family, style: requestedStyle };
    if (await tryLoad(fallbackFamilyStyled)) {
      return { fontName: fallbackFamilyStyled, fallback: true };
    }

    await figma.loadFontAsync(DEFAULT_FONT);
    return { fontName: DEFAULT_FONT, fallback: true };
  },
};

function styleNameFor(query: FontQuery): string {
  const bold = query.bold === true || (query.fontWeight !== undefined && query.fontWeight >= 700);
  const italic = query.italic === true;
  if (bold && italic) return 'Bold Italic';
  if (bold) return 'Bold';
  if (italic) return 'Italic';
  return 'Regular';
}

async function tryLoad(fontName: FontName): Promise<boolean> {
  try {
    await figma.loadFontAsync(fontName);
    return true;
  } catch {
    return false;
  }
}
