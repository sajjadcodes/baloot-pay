import type { INestApplication } from '@nestjs/common';
import { json, urlencoded } from 'express';

export const REQUEST_BODY_LIMIT = '100kb';

// Nest's automatic parsers are disabled at bootstrap so accepted formats and
// size limits stay explicit instead of depending on framework defaults.
export function configureBodyParsers(app: INestApplication): void {
  app.use(json({ limit: REQUEST_BODY_LIMIT }));
  app.use(urlencoded({ extended: false, limit: REQUEST_BODY_LIMIT }));
}
