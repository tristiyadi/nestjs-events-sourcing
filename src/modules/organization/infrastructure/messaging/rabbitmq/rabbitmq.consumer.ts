import {
  Injectable,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import amqp from 'amqplib';
import {
  DOMAIN_EVENTS_EXCHANGE,
  QUEUES,
  RABBITMQ_CHANNEL,
  ROUTING_KEYS,
} from './rabbitmq.constants';
import { OrganizationProjection } from '../../persistence/projections/organization.projection';
import { CardProjection } from '../../persistence/projections/card.projection';

@Injectable()
export class RabbitMQConsumer implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: amqp.Channel,
    private readonly organizationProjection: OrganizationProjection,
    private readonly cardProjection: CardProjection,
  ) {}
  onModuleDestroy() {
    this.channel.close();
  }
  async onModuleInit() {
    await this.start();
  }
  async start() {
    await this.channel.assertQueue(QUEUES.ORGANIZATION_CREATED, {
      durable: true,
    });
    await this.channel.bindQueue(
      QUEUES.ORGANIZATION_CREATED,
      DOMAIN_EVENTS_EXCHANGE,
      ROUTING_KEYS.ORGANIZATION_CREATED,
    );
    await this.channel.bindQueue(
      QUEUES.ORGANIZATION_CREATED,
      DOMAIN_EVENTS_EXCHANGE,
      'BalanceAddedEvent',
    );
    await this.channel.bindQueue(
      QUEUES.ORGANIZATION_CREATED,
      DOMAIN_EVENTS_EXCHANGE,
      'BalanceDeductedEvent',
    );
    await this.channel.bindQueue(
      QUEUES.ORGANIZATION_CREATED,
      DOMAIN_EVENTS_EXCHANGE,
      'CardCreatedEvent',
    );
    await this.channel.consume(
      QUEUES.ORGANIZATION_CREATED,
      async (msg) => {
        if (!msg) return;
        try {
          const event = JSON.parse(msg.content.toString());
          switch (event.eventType) {
            case 'OrganizationCreatedEvent':
              await this.organizationProjection.project(event);
              break;
            case 'BalanceAddedEvent':
              await this.organizationProjection.projectUpdate(event);
              break;
            case 'BalanceDeductedEvent':
              // Handle deduction if needed, for now just ack
              break;
            case 'CardCreatedEvent':
              await this.cardProjection.project(event);
              break;
            default:
              console.warn(`Unhandled event type: ${event.eventType}`);
              this.channel.ack(msg);
              return;
          }

          this.channel.ack(msg);
        } catch (error) {
          console.error('RabbitMQ consumer error', error);
          this.channel.nack(msg, false, false);
        }
      },
      { noAck: false },
    );
  }
}
