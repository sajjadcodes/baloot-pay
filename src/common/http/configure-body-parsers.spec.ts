import type { INestApplication } from '@nestjs/common';
import { REQUEST_BODY_LIMIT } from '../constants/http.constants';
import { configureBodyParsers } from './configure-body-parsers';

describe('configureBodyParsers', () => {
  it('registers JSON and URL-encoded parsers with the request size limit', () => {
    const use = jest.fn<void, [handler: unknown]>();
    const app = { use } as unknown as INestApplication;

    configureBodyParsers(app);

    expect(REQUEST_BODY_LIMIT).toBe('100kb');
    expect(use).toHaveBeenCalledTimes(2);
    expect(
      use.mock.calls.every(([handler]) => typeof handler === 'function'),
    ).toBe(true);
  });
});
