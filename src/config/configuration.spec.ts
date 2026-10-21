import { validateConfiguration } from './configuration';

describe('validateConfiguration', () => {
  it('uses the default port when PORT is not set', () => {
    expect(validateConfiguration({})).toEqual({ port: 3000 });
  });

  it('accepts a valid port at the lower and upper bounds', () => {
    expect(validateConfiguration({ PORT: '1' })).toEqual({ port: 1 });
    expect(validateConfiguration({ PORT: '65535' })).toEqual({
      port: 65535,
    });
  });

  it('parses a valid configured port', () => {
    expect(validateConfiguration({ PORT: '8080' })).toEqual({ port: 8080 });
  });

  it.each(['', ' 3000', '3000 ', '3e3', '0', '65536', '-1', '3000.5'])(
    'rejects invalid PORT value %j',
    (PORT) => {
      expect(() => validateConfiguration({ PORT })).toThrow(
        'Invalid PORT: expected an integer from 1 to 65535.',
      );
    },
  );
});
