import { xml2js } from 'xml-js';
import { stripPrefixes } from './lib-bridge';
import { CliError } from './errors';
import { DetectedDocumentType } from './types';

type XmlRecord = Record<string, any>;

export function parseXmlText(xmlText: string): XmlRecord {
  try {
    return stripPrefixes(xml2js(xmlText, { compact: true })) as XmlRecord;
  } catch (error) {
    throw new CliError(`Failed to parse XML: ${(error as Error).message}`, 3);
  }
}

export function detectDocumentType(parsedXml: XmlRecord): DetectedDocumentType {
  const formCode: string | undefined = parsedXml?.Faktura?.Naglowek?.KodFormularza?._attributes?.kodSystemowy;

  if (formCode === 'FA (1)') {
    return 'invoice-fa1';
  }

  if (formCode === 'FA (2)') {
    return 'invoice-fa2';
  }

  if (formCode === 'FA (3)') {
    return 'invoice-fa3';
  }

  const potwierdzenie = parsedXml?.Potwierdzenie ?? parsedXml?.UPO?.Potwierdzenie;
  if (potwierdzenie) {
    return 'upo';
  }

  throw new CliError('Unsupported XML schema. Expected FA (1|2|3) invoice or UPO XML.', 3);
}
