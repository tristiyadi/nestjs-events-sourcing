/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { DomainEvent } from 'src/shared/kernel/domain-event';
import { BalanceDeductedEvent } from '../../domain/events/balance-deducted.event';
import { BalanceAddedEvent } from '../../domain/events/balance-added.event';
import { CardCreatedEvent } from '../../domain/events/card-created.event';
import { OrganizationCreatedEvent } from '../../domain/events/organization-created.event';
import { TransactionApprovedEvent } from '../../domain/events/transaction-approved.event';
import { TransactionCreatedEvent } from '../../domain/events/transaction-created.event';
import { TransactionRejectedEvent } from '../../domain/events/transaction-rejected.event';
import { EventMetadata } from 'src/shared/kernel/event-metadata';

const EVENT_REGISTRY: Record<string, any> = {
  TransactionCreatedEvent,
  TransactionApprovedEvent,
  TransactionRejectedEvent,
  OrganizationCreatedEvent,
  BalanceAddedEvent,
  BalanceDeductedEvent,
  CardCreatedEvent,
};

@Injectable()
export class EventMapper {
  toDomain(row: any): DomainEvent {
    const ctor = EVENT_REGISTRY[row.event_name];
    if (ctor && typeof ctor === 'function') {
      return new ctor(row.metadata, row.payload);
    }
    class GenericDomainEvent extends DomainEvent<any> {
      constructor(
        metadata: EventMetadata,
        payload: any,
        public override eventType: string,
      ) {
        super(metadata, payload);
      }
      getEventName(): string {
        return this.eventType;
      }
    }

    return new GenericDomainEvent(row.metadata, row.payload, row.event_name);
  }
}
