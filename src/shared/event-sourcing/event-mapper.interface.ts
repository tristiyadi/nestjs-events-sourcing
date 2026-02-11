import { DomainEvent } from './domain-event';

export interface IEventMapper {
  toDomain(raw: any): DomainEvent;
  toPersistence(event: DomainEvent): any;
}
