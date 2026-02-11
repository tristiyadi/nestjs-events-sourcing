import { DomainEvent } from 'src/shared/event-sourcing/domain-event';
import { EventMetadata } from 'src/shared/kernel/event-metadata';

export type CardCreatedEventPayload = {
  organizationId: string;
  cardNumber: string;
  dailyLimit: number;
  monthlyLimit: number;
};

export class CardCreatedEvent extends DomainEvent<CardCreatedEventPayload> {
  constructor(eventMetadata: EventMetadata, payload: CardCreatedEventPayload) {
    super(eventMetadata, payload);
  }
  getEventName(): string {
    return 'CardCreatedEvent';
  }
}
