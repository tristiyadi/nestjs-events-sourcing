import { EventMetadata } from '../kernel/event-metadata';

export abstract class DomainEvent<T = any> {
  readonly metadata: EventMetadata;
  readonly payload: T;
  readonly eventType: string;
  readonly occurredOn: Date;

  protected constructor(metadata: EventMetadata, payload: T) {
    this.metadata = metadata;
    this.payload = payload;
    this.eventType = this.getEventName();
    this.occurredOn = new Date();
  }

  abstract getEventName(): string;
}
