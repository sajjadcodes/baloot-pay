import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

describe('HealthController', () => {
  it('delegates process liveness to the health service', () => {
    const service = new HealthService();
    const controller = new HealthController(service);

    expect(controller.getLiveness()).toEqual({ status: 'ok' });
  });
});
