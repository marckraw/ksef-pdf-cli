import { describe, expect, it } from 'bun:test';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { convertXml } from '../src/convert';
import { CliError } from '../src/errors';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, '../../..');
const fixtureInvoice = path.resolve(repoRoot, 'packages/ksef-pdf-generator/assets/invoice.xml');
const fixtureUpo = path.resolve(repoRoot, 'packages/ksef-pdf-generator/assets/upo.xml');

describe('convertXml', () => {
  it('generates invoice PDF when FA schema is detected', async () => {
    const outputPath = path.join(os.tmpdir(), `ksef-invoice-${Date.now()}.pdf`);

    const result = await convertXml({
      input: fixtureInvoice,
      output: outputPath,
      nrKSeF: '1234567890-20260101-ABCDEFG',
      qrCode: 'https://example.com/qr',
    });

    const stat = await fs.stat(outputPath);

    expect(result.documentType).toBe('invoice-fa3');
    expect(stat.size).toBeGreaterThan(1000);
  });

  it('generates UPO base64 without nrKSeF', async () => {
    const result = await convertXml({
      input: fixtureUpo,
      stdoutBase64: true,
    });

    expect(result.documentType).toBe('upo');
    expect(result.base64).toBeString();
    expect(result.base64!.length).toBeGreaterThan(1000);
  });

  it('fails for invoice conversion when nrKSeF is missing', async () => {
    await expect(
      convertXml({
        input: fixtureInvoice,
        stdoutBase64: true,
      })
    ).rejects.toMatchObject({
      name: CliError.name,
      exitCode: 2,
    });
  });

  it('merges --meta file and allows flag overrides', async () => {
    const metaPath = path.join(os.tmpdir(), `ksef-meta-${Date.now()}.json`);

    await fs.writeFile(
      metaPath,
      JSON.stringify({ nrKSeF: 'meta-value', qrCode: 'https://example.com/meta-qr' }, null, 2),
      'utf8'
    );

    const result = await convertXml({
      input: fixtureInvoice,
      stdoutBase64: true,
      metaPath,
      nrKSeF: 'flag-wins',
    });

    expect(result.documentType).toBe('invoice-fa3');
    expect(result.base64).toBeString();
    expect(result.base64!.length).toBeGreaterThan(1000);
  });
});
