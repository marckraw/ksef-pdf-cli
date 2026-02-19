import pdfMake, { TCreatedPdf } from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import {
  AdditionalDataTypes,
  generateDokumentUPO,
  generateFA1,
  generateFA2,
  generateFA3,
  generateNaglowekUPO,
  generateStyle,
  Position,
} from './lib-bridge';
import { CliError } from './errors';
import { CliMeta, DetectedDocumentType } from './types';

type XmlRecord = Record<string, any>;
const VIRTUAL_FONTS = getVirtualFonts(pdfFonts);

export async function generatePdfBuffer(
  documentType: DetectedDocumentType,
  parsedXml: XmlRecord,
  meta: CliMeta
): Promise<Buffer> {
  applyPdfFonts();

  if (documentType === 'upo') {
    return generateUpoPdf(parsedXml);
  }

  if (!meta.nrKSeF) {
    throw new CliError('Missing required metadata for invoice: nrKSeF', 2);
  }

  const additionalData: AdditionalDataTypes = {
    nrKSeF: meta.nrKSeF,
    qrCode: meta.qrCode,
  };

  let createdPdf: TCreatedPdf | undefined;

  switch (documentType) {
    case 'invoice-fa1':
      createdPdf = generateFA1(parsedXml.Faktura, additionalData);
      break;
    case 'invoice-fa2':
      createdPdf = generateFA2(parsedXml.Faktura, additionalData);
      break;
    case 'invoice-fa3':
      createdPdf = generateFA3(parsedXml.Faktura, additionalData);
      break;
  }

  if (!createdPdf) {
    throw new CliError(`Unsupported invoice schema: ${documentType}`, 3);
  }

  return createdPdfToBuffer(createdPdf);
}

function generateUpoPdf(parsedXml: XmlRecord): Promise<Buffer> {
  const potwierdzenie = parsedXml?.Potwierdzenie ?? parsedXml?.UPO?.Potwierdzenie;

  if (!potwierdzenie) {
    throw new CliError('UPO XML is missing Potwierdzenie node.', 3);
  }

  const docDefinition: TDocumentDefinitions = {
    content: [generateNaglowekUPO(potwierdzenie) as any, generateDokumentUPO(potwierdzenie) as any],
    ...generateStyle(),
    pageSize: 'A4',
    pageOrientation: 'landscape',
    footer(currentPage: number, pageCount: number) {
      return {
        text: `${currentPage} z ${pageCount}`,
        alignment: Position.RIGHT,
        margin: [0, 0, 20, 0],
      };
    },
  };

  return createdPdfToBuffer(pdfMake.createPdf(docDefinition));
}

function createdPdfToBuffer(createdPdf: TCreatedPdf): Promise<Buffer> {
  return new Promise((resolve, reject): void => {
    createdPdf.getBuffer((data: Uint8Array): void => {
      if (!data) {
        reject(new CliError('Failed to generate PDF buffer.', 4));
        return;
      }
      resolve(Buffer.from(data));
    });
  });
}

function applyPdfFonts(): void {
  if (!VIRTUAL_FONTS) {
    throw new CliError('Unable to configure pdfmake fonts.', 4);
  }

  (pdfMake as any).vfs = VIRTUAL_FONTS;
}

function getVirtualFonts(fonts: unknown): Record<string, string> | undefined {
  const typedFonts = fonts as Record<string, unknown> | undefined;

  const fromCommonShapes =
    (typedFonts?.vfs as Record<string, string> | undefined) ??
    (typedFonts?.pdfMake as { vfs?: Record<string, string> } | undefined)?.vfs ??
    ((typedFonts?.default as { vfs?: Record<string, string>; pdfMake?: { vfs?: Record<string, string> } } | undefined)
      ?.vfs ??
      (typedFonts?.default as { pdfMake?: { vfs?: Record<string, string> } } | undefined)?.pdfMake?.vfs);

  if (fromCommonShapes) {
    return fromCommonShapes;
  }

  // Bun resolves `pdfmake/build/vfs_fonts` as the raw map.
  if (typedFonts && 'Roboto-Regular.ttf' in typedFonts) {
    return typedFonts as Record<string, string>;
  }

  return undefined;
}
