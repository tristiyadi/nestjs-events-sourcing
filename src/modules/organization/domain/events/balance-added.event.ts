import { DomainEvent } from 'src/shared/event-sourcing/domain-event';
import { EventMetadata } from 'src/shared/kernel/event-metadata';

export type BalanceAddedEventPayload = {
  amount: number;
  currency: string;
};

export class BalanceAddedEvent extends DomainEvent<BalanceAddedEventPayload> {
  constructor(eventMetadata: EventMetadata, payload: BalanceAddedEventPayload) {
    super(eventMetadata, payload);
  }
  getEventName(): string {
    return 'BalanceAddedEvent';
  }
}
