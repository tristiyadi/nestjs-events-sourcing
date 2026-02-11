import { EventMetadata } from './event-metadata';

export abstract class DomainEvent<T = any> {
  readonly metadata: EventMetadata;
  readonly payload: T;
  readonly eventType: string;

  protected constructor(metadata: EventMetadata, payload: T) {
    this.metadata = metadata;
    this.payload = payload;
    this.eventType = this.getEventName();
  }

  abstract getEventName(): string;
}
