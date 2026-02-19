export type DetectedDocumentType = 'invoice-fa1' | 'invoice-fa2' | 'invoice-fa3' | 'upo';

export interface CliMeta {
  nrKSeF?: string;
  qrCode?: string;
}

export interface ConvertOptions {
  input: string;
  output?: string;
  stdoutBase64?: boolean;
  metaPath?: string;
  nrKSeF?: string;
  qrCode?: string;
}

export interface ConvertResult {
  documentType: DetectedDocumentType;
  outputPath?: string;
  base64?: string;
}
