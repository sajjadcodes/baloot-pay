import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureBodyParsers } from './common/http/configure-body-parsers.js';
import { validateConfiguration } from './config/configuration.js';
import { GlobalExceptionFilter } from './filters/global-exception.filter.js';
import { SuccessResponseInterceptor } from './interceptors/success-response.interceptor.js';
import { RequestContextMiddleware } from './middleware/request-context.middleware.js';

async function bootstrap() {
  const configuration = validateConfiguration(process.env);
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(new RequestContextMiddleware().use);
  configureBodyParsers(app);
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new SuccessResponseInterceptor());
  await app.listen(configuration.port);
}
void bootstrap();
