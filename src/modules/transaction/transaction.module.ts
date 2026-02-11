import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TransactionController } from './api/transaction/transaction.controller';
import { ProcessTransactionHandler } from './application/commands/handlers/process-transaction.handler';
import { GetTransactionStatusHandler } from './application/queries/handlers/get-transaction-status.handler';
import { ConcurencyLockService } from './application/services/concurrency-lock.service';
import { IdempotencyService } from './application/services/idempotency.service';
import { TransactionService } from './application/services/transaction.service';
import { BalanceProjection } from './infrastructure/persistence/projections/balance.projection';
import { RedisCacheService } from './infrastructure/cache/redis/redis-idempotency.service';
import { RedisLockService } from './infrastructure/cache/redis/redis-lock.service';
import { RabbitMQPublisher } from './infrastructure/messaging/rabbitmq/rabbitmq.publisher';
import { TransactionReadRepository } from './infrastructure/persistence/read-model/transaction-read.repository';
import { RabbitMQConsumer } from './infrastructure/messaging/rabbitmq/rabbitmq.consumer';
import { TransactionProjection } from './infrastructure/persistence/projections/transaction.projection';
import { TransactionSnapshotService } from './infrastructure/cache/redis/transaction-snapshot.service';
import { OrganizationModule } from '../organization/organization.module';
import { EventSourcingModule } from 'src/shared/event-sourcing/event-sourcing.module';
import { TransactionRepository } from './infrastructure/persistence/transaction.repository';
import { TransactionEventMapper } from './infrastructure/mappers/transaction-event.mapper';
import { Pool } from 'pg';
import { PostgresEventStore } from 'src/shared/event-sourcing/event-store';
import { redisClient } from 'src/shared/redis/redis.client';
import { RedisSnapshotStore } from 'src/shared/event-sourcing/snapshot-store';

@Module({
  imports: [
    OrganizationModule,
    EventSourcingModule,
    ClientsModule.register([
      {
        name: 'EVENT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [
            process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
          ],
          queue: 'domain-events-queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [TransactionController, RabbitMQConsumer],
  providers: [
    ProcessTransactionHandler,
    GetTransactionStatusHandler,
    ConcurencyLockService,
    IdempotencyService,
    TransactionService,
    TransactionEventMapper,
    {
      provide: 'EVENT_STORE',
      useFactory: (pool: Pool, mapper: TransactionEventMapper) => {
        return new PostgresEventStore(pool, mapper);
      },
      inject: [Pool, TransactionEventMapper],
    },
    {
      provide: 'TRANSACTION_REPOSITORY',
      useClass: TransactionRepository,
    },
    {
      provide: 'TransactionReadPort',
      useClass: TransactionReadRepository,
    },
    {
      provide: 'RedisCachePort',
      useClass: RedisCacheService,
    },
    {
      provide: 'ConcurrencyLockPort',
      useClass: RedisLockService,
    },
    {
      provide: 'EventBusPort',
      useClass: RabbitMQPublisher,
    },
    {
      provide: 'REDIS_CLIENT',
      useValue: redisClient,
    },
    {
      provide: 'SNAPSHOT_STORE',
      useClass: RedisSnapshotStore,
    },
    TransactionProjection,
    BalanceProjection,
    TransactionSnapshotService,
  ],
})
export class TransactionModule {}
