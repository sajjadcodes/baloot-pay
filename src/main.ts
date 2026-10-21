import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureBodyParsers } from './common/http/configure-body-parsers';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { SuccessResponseInterceptor } from './interceptors/success-response.interceptor';
import { RequestContextMiddleware } from './middleware/request-context.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(new RequestContextMiddleware().use);
  configureBodyParsers(app);
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new SuccessResponseInterceptor());
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
