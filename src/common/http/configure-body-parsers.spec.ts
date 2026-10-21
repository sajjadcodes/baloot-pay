import type { INestApplication } from '@nestjs/common';
import { jest } from '@jest/globals';
import { REQUEST_BODY_LIMIT } from '../constants/http.constants.js';
import { configureBodyParsers } from './configure-body-parsers.js';

describe('configureBodyParsers', () => {
  it('registers JSON and URL-encoded parsers with the request size limit', () => {
    const use = jest.fn<(handler: unknown) => void>();
    const app = { use } as unknown as INestApplication;

    configureBodyParsers(app);

    expect(REQUEST_BODY_LIMIT).toBe('100kb');
    expect(use).toHaveBeenCalledTimes(2);
    expect(
      use.mock.calls.every(([handler]) => typeof handler === 'function'),
    ).toBe(true);
  });
});
