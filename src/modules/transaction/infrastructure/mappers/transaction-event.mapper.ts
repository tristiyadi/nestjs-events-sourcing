import { Injectable } from '@nestjs/common';
import { IEventMapper } from 'src/shared/event-sourcing/event-mapper.interface';
import { DomainEvent } from 'src/shared/event-sourcing/domain-event';
import { TransactionCreatedEvent } from '../../domain/events/transaction-created.event';
import { TransactionApprovedEvent } from '../../domain/events/transaction-approved.event';
import { TransactionRejectedEvent } from '../../domain/events/transaction-rejected.event';
import { EventMetadata } from 'src/shared/kernel/event-metadata';

@Injectable()
export class TransactionEventMapper implements IEventMapper {
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
      case 'TransactionCreatedEvent':
        return new TransactionCreatedEvent(eventMetadata, payload);
      case 'TransactionApprovedEvent':
        return new TransactionApprovedEvent(eventMetadata, payload);
      case 'TransactionRejectedEvent':
        return new TransactionRejectedEvent(eventMetadata, payload);
      default:
        throw new Error(`Unknown event type: ${event_name}`);
    }
  }
}
