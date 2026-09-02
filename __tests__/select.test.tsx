import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getNextSelectableIndex, getSelectableIndex, Select, type SelectOption } from '@/components/ui/Select';

const options: SelectOption<string>[] = [
  { value: 'off', label: 'Nonaktif' },
  { value: 'five', label: '5 menit sebelum' },
  { value: 'disabled', label: 'Tidak tersedia', disabled: true },
  { value: 'ten', label: '10 menit sebelum' },
];

describe('shared Select primitive', () => {
  it('renders the selected value and listbox trigger semantics', () => {
    const html = renderToStaticMarkup(
      <Select value="ten" options={options} onValueChange={() => undefined} ariaLabel="Pengingat Subuh" />
    );
    expect(html).toContain('10 menit sebelum');
    expect(html).toContain('aria-haspopup="listbox"');
    expect(html).toContain('aria-expanded="false"');
  });

  it('resolves selected and keyboard navigation indices while skipping disabled options', () => {
    expect(getSelectableIndex(options, 'ten')).toBe(3);
    expect(getSelectableIndex(options, 'missing')).toBe(0);
    expect(getSelectableIndex(options, 'disabled')).toBe(0);
    expect(getNextSelectableIndex(options, 0, 1)).toBe(1);
    expect(getNextSelectableIndex(options, 1, 1)).toBe(3);
    expect(getNextSelectableIndex(options, 3, 1)).toBe(0);
    expect(getNextSelectableIndex(options, 0, -1)).toBe(3);
    expect(getNextSelectableIndex(options, 1, -1)).toBe(0);
  });

  it('handles empty and fully disabled option sets safely', () => {
    const disabledOptions: SelectOption<string>[] = [
      { value: 'one', label: 'Satu', disabled: true },
      { value: 'two', label: 'Dua', disabled: true },
    ];

    expect(getSelectableIndex([], 'missing')).toBe(-1);
    expect(getSelectableIndex(disabledOptions, 'one')).toBe(-1);
    expect(getNextSelectableIndex([], -1, 1)).toBe(-1);
    expect(getNextSelectableIndex(disabledOptions, 0, 1)).toBe(0);
  });

  it('keeps native select markup out of the shared trigger', () => {
    const html = renderToStaticMarkup(
      <Select value="off" options={options} onValueChange={() => undefined} ariaLabel="Pengingat" />
    );
    expect(html).not.toContain('<select');
    expect(html).not.toContain('<option');
  });
});
