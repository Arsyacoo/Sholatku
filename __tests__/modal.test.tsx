import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Modal } from '@/components/ui/Modal';

describe('shared Modal primitive', () => {
  it('exposes an accessible dialog name and unique title references', () => {
    const html = renderToStaticMarkup(
      <>
        <Modal isOpen onClose={() => undefined} title="Pilih Lokasi">
          <input aria-label="Cari lokasi" />
        </Modal>
        <Modal isOpen onClose={() => undefined} title="Pengaturan">
          <button type="button">Simpan</button>
        </Modal>
      </>
    );

    expect((html.match(/role="dialog"/g) ?? []).length).toBe(2);
    expect((html.match(/aria-modal="true"/g) ?? []).length).toBe(2);
    const labelledBy = [...html.matchAll(/aria-labelledby="([^"]+)"/g)].map((match) => match[1]);
    expect(labelledBy).toHaveLength(2);
    expect(new Set(labelledBy).size).toBe(2);
    expect(html).toContain('Pilih Lokasi');
    expect(html).toContain('Pengaturan');
  });
});
