import { HealthService } from './health.service.js';

describe('HealthService', () => {
  it('reports that the process is alive', () => {
    expect(new HealthService().getLiveness()).toEqual({ status: 'ok' });
  });
});
