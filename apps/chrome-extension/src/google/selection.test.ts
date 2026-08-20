import { describe, expect, it } from 'vitest';
import { isSelectionActive, type SelectionMarkerLookup } from './selection';

function lookupOf(visibleIds: string[]): SelectionMarkerLookup {
  return { isVisible: (id) => visibleIds.includes(id) };
}

describe('isSelectionActive', () => {
  it('is false when none of the marker ids are visible', () => {
    expect(isSelectionActive(lookupOf([]))).toBe(false);
  });

  it('is true when the format-options marker is visible', () => {
    expect(isSelectionActive(lookupOf(['formatOptionsButton']))).toBe(true);
  });

  it('is true when any single known marker is visible', () => {
    expect(isSelectionActive(lookupOf(['cropImageButton']))).toBe(true);
    expect(isSelectionActive(lookupOf(['lineColorMenuButton']))).toBe(true);
  });

  it('ignores unrelated visible ids', () => {
    expect(isSelectionActive(lookupOf(['animationButton', 'insertLinkButton']))).toBe(false);
  });
});
