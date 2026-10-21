export interface AppConfiguration {
  port: number;
}

const DEFAULT_PORT = 3000;
const MIN_PORT = 1;
const MAX_PORT = 65535;

export function validateConfiguration(
  environment: NodeJS.ProcessEnv,
): AppConfiguration {
  const rawPort = environment.PORT;

  if (rawPort === undefined) {
    return { port: DEFAULT_PORT };
  }

  if (!/^\d+$/.test(rawPort)) {
    throw new Error('Invalid PORT: expected an integer from 1 to 65535.');
  }

  const port = Number(rawPort);
  if (!Number.isSafeInteger(port) || port < MIN_PORT || port > MAX_PORT) {
    throw new Error('Invalid PORT: expected an integer from 1 to 65535.');
  }

  return { port };
}
