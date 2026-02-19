import { promises as fs } from 'node:fs';
import path from 'node:path';
import { CliError } from './errors';
import { generatePdfBuffer } from './pdf';
import { ConvertOptions, ConvertResult } from './types';
import { detectDocumentType, parseXmlText } from './xml';

export async function convertXml(options: ConvertOptions): Promise<ConvertResult> {
  const xmlText = await readInputXml(options.input);
  const parsedXml = parseXmlText(xmlText);
  const documentType = detectDocumentType(parsedXml);

  const mergedMeta = await loadMergedMeta(options.metaPath, options.nrKSeF, options.qrCode);
  const pdfBuffer = await generatePdfBuffer(documentType, parsedXml, mergedMeta);

  if (options.stdoutBase64) {
    return {
      documentType,
      base64: pdfBuffer.toString('base64'),
    };
  }

  const outputPath = options.output ?? getDefaultOutputPath(options.input);

  try {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, pdfBuffer);
  } catch (error) {
    throw new CliError(`Unable to write output PDF: ${(error as Error).message}`, 5);
  }

  return {
    documentType,
    outputPath,
  };
}

async function readInputXml(inputPath: string): Promise<string> {
  if (!inputPath) {
    throw new CliError('Missing required argument: --input <path-to-xml>', 2);
  }

  try {
    return await fs.readFile(inputPath, 'utf8');
  } catch (error) {
    throw new CliError(`Unable to read input XML: ${(error as Error).message}`, 2);
  }
}

function getDefaultOutputPath(inputPath: string): string {
  const parsed = path.parse(inputPath);
  const fileName = `${parsed.name}.pdf`;
  return path.join(parsed.dir || '.', fileName);
}

async function loadMergedMeta(
  metaPath: string | undefined,
  nrKSeFFlag: string | undefined,
  qrCodeFlag: string | undefined
): Promise<{ nrKSeF?: string; qrCode?: string }> {
  let metaFromFile: { nrKSeF?: string; qrCode?: string } = {};

  if (metaPath) {
    try {
      const rawMeta = await fs.readFile(metaPath, 'utf8');
      const parsedMeta = JSON.parse(rawMeta);

      if (typeof parsedMeta !== 'object' || parsedMeta === null) {
        throw new Error('meta JSON must be an object');
      }

      metaFromFile = {
        nrKSeF: parsedMeta.nrKSeF,
        qrCode: parsedMeta.qrCode,
      };
    } catch (error) {
      throw new CliError(`Unable to load --meta file: ${(error as Error).message}`, 2);
    }
  }

  return {
    nrKSeF: nrKSeFFlag ?? metaFromFile.nrKSeF,
    qrCode: qrCodeFlag ?? metaFromFile.qrCode,
  };
}
