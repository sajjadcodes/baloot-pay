import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureBodyParsers } from './common/http/configure-body-parsers';
import { RequestContextMiddleware } from './common/http/request-context.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(new RequestContextMiddleware().use);
  configureBodyParsers(app);
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
