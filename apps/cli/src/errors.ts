export class CliError extends Error {
  exitCode: number;

  constructor(message: string, exitCode: number) {
    super(message);
    this.name = 'CliError';
    this.exitCode = exitCode;
  }
}
