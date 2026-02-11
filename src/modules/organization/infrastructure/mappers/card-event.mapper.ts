import { Injectable } from '@nestjs/common';
import { IEventMapper } from 'src/shared/event-sourcing/event-mapper.interface';
import { DomainEvent } from 'src/shared/event-sourcing/domain-event';
import { CardCreatedEvent } from '../../domain/events/card-created.event';
import { CardLimitUpdatedEvent } from '../../domain/events/card-limit-updated.event';
import { EventMetadata } from 'src/shared/kernel/event-metadata';

@Injectable()
export class CardEventMapper implements IEventMapper {
  toPersistence(event: DomainEvent): any {
    return {
      type: event.getEventName(),
      payload: event.payload,
      metadata: event.metadata,
    };
  }

  toDomain(raw: any): DomainEvent {
    const { event_name, payload, metadata } = raw;
    const eventMetadata = metadata as EventMetadata;

    switch (event_name) {
      case 'CardCreatedEvent':
        return new CardCreatedEvent(eventMetadata, payload);
      case 'CardLimitUpdatedEvent':
        return new CardLimitUpdatedEvent(eventMetadata, payload);
      default:
        throw new Error(`Unknown event type: ${event_name}`);
    }
  }
}
