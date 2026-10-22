import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getLiveness(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
