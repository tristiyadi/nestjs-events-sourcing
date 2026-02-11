import { Injectable } from '@nestjs/common';
import { IEventMapper } from 'src/shared/event-sourcing/event-mapper.interface';
import { DomainEvent } from 'src/shared/event-sourcing/domain-event';
import { OrganizationCreatedEvent } from '../../domain/events/organization-created.event';
import { BalanceAddedEvent } from '../../domain/events/balance-added.event';
import { BalanceDeductedEvent } from '../../domain/events/balance-deducted.event';
import { EventMetadata } from 'src/shared/kernel/event-metadata';

@Injectable()
export class OrganizationEventMapper implements IEventMapper {
  toPersistence(event: DomainEvent): any {
    return {
      type: event.getEventName(),
      payload: event.payload,
      metadata: event.metadata,
    };
  }

  toDomain(raw: any): DomainEvent {
    const { event_name, payload, metadata } = raw;
    // Ensure metadata is properly shaped if needed, or cast it
    const eventMetadata = metadata as EventMetadata;

    switch (event_name) {
      case 'OrganizationCreatedEvent':
        return new OrganizationCreatedEvent(eventMetadata, payload);
      case 'BalanceAddedEvent':
        return new BalanceAddedEvent(eventMetadata, payload);
      case 'BalanceDeductedEvent':
        return new BalanceDeductedEvent(eventMetadata, payload);
      default:
        throw new Error(`Unknown event type: ${event_name}`);
    }
  }
}
