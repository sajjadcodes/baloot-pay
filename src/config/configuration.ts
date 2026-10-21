import {
  DEFAULT_PORT,
  INVALID_PORT_MESSAGE,
  MAX_PORT,
  MIN_PORT,
} from '../common/constants/application.constants.js';
import { PORT_PATTERN } from '../common/constants/regex.constants.js';

export interface AppConfiguration {
  port: number;
}

export function validateConfiguration(
  environment: NodeJS.ProcessEnv,
): AppConfiguration {
  const rawPort = environment.PORT;

  if (rawPort === undefined) {
    return { port: DEFAULT_PORT };
  }

  if (!PORT_PATTERN.test(rawPort)) {
    throw new Error(INVALID_PORT_MESSAGE);
  }

  const port = Number(rawPort);
  if (!Number.isSafeInteger(port) || port < MIN_PORT || port > MAX_PORT) {
    throw new Error(INVALID_PORT_MESSAGE);
  }

  return { port };
}
