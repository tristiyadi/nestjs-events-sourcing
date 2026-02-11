/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { DomainEvent } from 'src/shared/event-sourcing/domain-event';
import { AggregateRoot } from 'src/shared/event-sourcing/aggregate-root';
import { Card } from '../entities/card.entity';
import { CardCreatedEvent } from '../events/card-created.event';
import { CardLimitRule } from '../rules/card-limit.rule';
import { CardLimitUpdatedEvent } from '../events/card-limit-updated.event';
import { CardLimit } from '../value-objects/card-limit.vo';
import { EventMetadata } from 'src/shared/kernel/event-metadata';

export class CardAggregate extends AggregateRoot {
  private card: Card;

  constructor(id: string) {
    super();
    this.id = id;
  }

  create(
    cardNumber: string,
    organizationId: string,
    dailyLimit: number,
    monthlyLimit: number,
    metadata: EventMetadata,
  ): void {
    if (this.card) {
      throw new Error('Card already created');
    }
    this.apply(
      new CardCreatedEvent(metadata, {
        organizationId,
        cardNumber,
        dailyLimit,
        monthlyLimit,
      }),
    );
  }

  applyUsage(amount: number, metadata: EventMetadata): void {
    this.ensureState();
    CardLimitRule.check(this.card.cardLimit, amount);
    this.apply(
      new CardLimitUpdatedEvent(metadata, {
        cardId: this.card.id,
        amount: amount,
        cardLimit: this.card.cardLimit.applyTransaction(amount),
      }),
    );
  }

  private ensureState(): void {
    if (!this.card) {
      throw new Error('Card not created');
    }
  }

  protected when(event: DomainEvent): void {
    switch (event.getEventName()) {
      case 'CardCreatedEvent':
        const cardCreated = event as CardCreatedEvent;
        this.card = new Card(
          this.id,
          cardCreated.payload.cardNumber,
          new CardLimit({
            dailyLimit: cardCreated.payload.dailyLimit,
            monthlyLimit: cardCreated.payload.monthlyLimit,
            dailyUsed: 0,
            monthlyUsed: 0,
          }),
        );
        break;
      case 'CardLimitUpdatedEvent':
        const limitUpdated = event as CardLimitUpdatedEvent;
        this.card.applyUsage(limitUpdated.payload.amount);
        break;
      default:
        break;
    }
  }
}
