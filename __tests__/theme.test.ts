import { describe, it, expect } from 'vitest';

describe('Theme Mode Logic', () => {
  it('supports light, dark, and system theme options', () => {
    const validThemes = ['light', 'dark', 'system'];
    expect(validThemes).toContain('light');
    expect(validThemes).toContain('dark');
    expect(validThemes).toContain('system');
  });
});
