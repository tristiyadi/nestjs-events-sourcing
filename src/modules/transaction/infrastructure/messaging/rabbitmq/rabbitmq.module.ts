import { RabbitMQConsumer } from './rabbitmq.consumer';
import { RabbitMQPublisher } from './rabbitmq.publisher';

import { RABBITMQ_CHANNEL } from './rabbitmq.constants';

import { TransactionProjection } from '../../persistence/projections/transaction.projection';
import { Module } from '@nestjs/common/decorators/modules/module.decorator';
import { Global } from '@nestjs/common';
import { createRabbitMQChannel } from 'src/bootstrap/rabbitmq.bootstrap';

@Global()
@Module({
  providers: [
    {
      provide: RABBITMQ_CHANNEL,
      useFactory: createRabbitMQChannel,
    },
    RabbitMQPublisher,
    RabbitMQConsumer,
    TransactionProjection,
  ],
})
export class RabbitMQModule {}
