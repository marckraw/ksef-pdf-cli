#!/usr/bin/env bun

import cliPackageJson from '../package.json';
import { convertXml } from './convert';
import { CliError } from './errors';
import { ConvertOptions } from './types';

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  if (args.length === 1 && (args[0] === '--version' || args[0] === '-v')) {
    console.log(cliPackageJson.version);
    return;
  }

  const command = args[0];
  if (command !== 'convert') {
    throw new CliError(`Unknown command: ${command}`, 2);
  }

  const options = parseConvertArgs(args.slice(1));
  const result = await convertXml(options);

  if (result.base64) {
    process.stdout.write(`${result.base64}\n`);
    return;
  }

  process.stderr.write(`Generated ${result.documentType} PDF: ${result.outputPath}\n`);
}

function parseConvertArgs(args: string[]): ConvertOptions {
  const options: ConvertOptions = {
    input: '',
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    switch (arg) {
      case '--input':
      case '-i':
        options.input = readValue(args, ++index, arg);
        break;
      case '--output':
      case '-o':
        options.output = readValue(args, ++index, arg);
        break;
      case '--nr-ksef':
        options.nrKSeF = readValue(args, ++index, arg);
        break;
      case '--qr-code':
        options.qrCode = readValue(args, ++index, arg);
        break;
      case '--meta':
        options.metaPath = readValue(args, ++index, arg);
        break;
      case '--stdout-base64':
        options.stdoutBase64 = true;
        break;
      default:
        throw new CliError(`Unknown option: ${arg}`, 2);
    }
  }

  if (!options.input) {
    throw new CliError('Missing required option: --input <path-to-xml>', 2);
  }

  return options;
}

function readValue(args: string[], index: number, flag: string): string {
  const value = args[index];

  if (!value || value.startsWith('-')) {
    throw new CliError(`Missing value for ${flag}`, 2);
  }

  return value;
}

function printHelp(): void {
  process.stdout.write(`ksef-pdf ${cliPackageJson.version}\n\n`);
  process.stdout.write('Usage:\n');
  process.stdout.write('  ksef-pdf convert --input <xml-path> [options]\n\n');
  process.stdout.write('Options:\n');
  process.stdout.write('  -i, --input <path>      Input XML file path (required)\n');
  process.stdout.write('  -o, --output <path>     Output PDF path (default: <input>.pdf)\n');
  process.stdout.write('      --nr-ksef <value>   Invoice metadata: nrKSeF (required for invoices)\n');
  process.stdout.write('      --qr-code <value>   Invoice metadata: qrCode (optional)\n');
  process.stdout.write('      --meta <path>       Path to metadata JSON file\n');
  process.stdout.write('      --stdout-base64     Print PDF as base64 to stdout\n');
  process.stdout.write('  -h, --help              Show help\n');
  process.stdout.write('  -v, --version           Show CLI version\n\n');
  process.stdout.write('Metadata file shape:\n');
  process.stdout.write('  { "nrKSeF": "...", "qrCode": "..." }\n');
}

main().catch((error: unknown): void => {
  if (error instanceof CliError) {
    process.stderr.write(`${error.message}\n`);
    process.exit(error.exitCode);
  }

  process.stderr.write(`${(error as Error).message}\n`);
  process.exit(1);
});
