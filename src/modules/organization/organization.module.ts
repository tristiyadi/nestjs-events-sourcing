import { Module } from '@nestjs/common';
import { CardController } from './api/card/card.controller';
import { OrganizationController } from './api/organization/organization.controller';
import { Pool } from 'pg';
import { CardCommandHandler } from './application/commands/card/handler/card-command.handler';
import { OrganizationCommandHandler } from './application/commands/organization/handler/organization-command.handler';
import { CardService } from './application/services/card.service';
import { ConcurencyLockService } from './application/services/concurrency-lock.service';
import { IdempotencyService } from './application/services/idempotency.service';
import { OrganizationService } from './application/services/organization.service';
import { RabbitMQConsumer } from './infrastructure/messaging/rabbitmq/rabbitmq.consumer';
import { RabbitMQPublisher } from './infrastructure/messaging/rabbitmq/rabbitmq.publisher';
import { OrganizationProjection } from './infrastructure/persistence/projections/organization.projection';
import { CardProjection } from './infrastructure/persistence/projections/card.projection';
import { RedisCacheService } from './infrastructure/redis/redis-idempotency.service';
import { RedisLockService } from './infrastructure/redis/redis-lock.service';
import { EventSourcingModule } from 'src/shared/event-sourcing/event-sourcing.module';
import { OrganizationRepository } from './infrastructure/persistence/organization.repository';
import { PostgresEventStore } from 'src/shared/event-sourcing/event-store';
import { OrganizationEventMapper } from './infrastructure/mappers/organization-event.mapper';
import { CardRepository } from './infrastructure/persistence/card.repository';
import { CardEventMapper } from './infrastructure/mappers/card-event.mapper';
import { redisClient } from 'src/shared/redis/redis.client';
import { RedisSnapshotStore } from 'src/shared/event-sourcing/snapshot-store';

@Module({
  imports: [EventSourcingModule],
  controllers: [CardController, OrganizationController],
  providers: [
    OrganizationCommandHandler,
    CardCommandHandler,
    ConcurencyLockService,
    IdempotencyService,
    OrganizationService,
    CardService,
    OrganizationEventMapper,
    CardEventMapper,
    {
      provide: 'ORGANIZATION_EVENT_STORE',
      useFactory: (pool: Pool, mapper: OrganizationEventMapper) => {
        return new PostgresEventStore(pool, mapper);
      },
      inject: [Pool, OrganizationEventMapper],
    },
    {
      provide: 'CARD_EVENT_STORE',
      useFactory: (pool: Pool, mapper: CardEventMapper) => {
        return new PostgresEventStore(pool, mapper);
      },
      inject: [Pool, CardEventMapper],
    },
    {
      provide: 'ORGANIZATION_REPOSITORY',
      useClass: OrganizationRepository,
    },
    {
      provide: 'CARD_REPOSITORY',
      useClass: CardRepository,
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
    RabbitMQConsumer,
    OrganizationProjection,
    CardProjection,
  ],
  exports: ['ORGANIZATION_REPOSITORY', 'CARD_REPOSITORY'],
})
export class OrganizationModule {}
