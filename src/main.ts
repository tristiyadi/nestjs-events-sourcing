/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5673'],
      queue: 'domain-events-queue',
      noAck: false, // We manually ack
      queueOptions: {
        durable: true,
      },
      exchange: 'domain-events',
      exchangeType: 'topic',
    },
  });
  await app.startAllMicroservices();
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Fast Logic API')
    .setDescription('Transaction & Event-Sourcing API')
    .setVersion('1.0.0')
    .addBearerAuth() // kalau pakai JWT
    .addApiKey(
      { type: 'apiKey', name: 'x-checksum', in: 'header' },
      'x-checksum',
    )
    .addApiKey(
      { type: 'apiKey', name: 'x-correlation-id', in: 'header' },
      'x-correlation-id',
    )
    .addApiKey(
      { type: 'apiKey', name: 'x-organization-id', in: 'header' },
      'x-organization-id',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Fast Logic API running on port ${port}`);
}
void bootstrap();
