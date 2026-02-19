import type { TCreatedPdf } from 'pdfmake/build/pdfmake';

export interface AdditionalDataTypes {
  nrKSeF: string;
  qrCode?: string;
}

export declare function generateFA1(invoice: unknown, additionalData: AdditionalDataTypes): TCreatedPdf;
export declare function generateFA2(invoice: unknown, additionalData: AdditionalDataTypes): TCreatedPdf;
export declare function generateFA3(invoice: unknown, additionalData: AdditionalDataTypes): TCreatedPdf;

export declare function generateNaglowekUPO(potwierdzenie: unknown): unknown;
export declare function generateDokumentUPO(potwierdzenie: unknown): unknown;

export declare function generateStyle(): Record<string, unknown>;

export declare enum Position {
  LEFT = 'left',
  RIGHT = 'right',
  CENTER = 'center',
  JUSTIFY = 'justify'
}

export declare function stripPrefixes<T>(obj: T): T;
