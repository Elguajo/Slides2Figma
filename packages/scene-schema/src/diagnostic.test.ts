import { describe, expect, it } from 'vitest';
import { DiagnosticSchema } from './diagnostic';

describe('DiagnosticSchema', () => {
  it('accepts a minimal diagnostic', () => {
    const result = DiagnosticSchema.safeParse({
      severity: 'warning',
      code: 'missing-font',
      message: 'Missing font: Helvetica Neue Medium',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid severity', () => {
    const result = DiagnosticSchema.safeParse({
      severity: 'critical',
      code: 'missing-font',
      message: 'Missing font',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing code', () => {
    const result = DiagnosticSchema.safeParse({
      severity: 'error',
      message: 'Something failed',
    });
    expect(result.success).toBe(false);
  });
});
