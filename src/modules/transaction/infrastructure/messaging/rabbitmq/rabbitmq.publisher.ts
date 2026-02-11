/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
import { EventBusPort } from 'src/modules/transaction/application/ports/event-bus.port';
import { DomainEvent } from 'src/shared/kernel/domain-event';
import { ClientProxy } from '@nestjs/microservices';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class RabbitMQPublisher implements EventBusPort {
  constructor(
    @Inject('EVENT_SERVICE')
    private readonly client: ClientProxy,
  ) {}
  async publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      this.client.emit(event.getEventName(), event);
    }
  }
}
