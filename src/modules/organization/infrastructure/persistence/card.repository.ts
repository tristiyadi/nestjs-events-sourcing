/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable } from '@nestjs/common';
import { ICardRepository } from '../../domain/repositories/card-repository.interface';
import { CardAggregate } from '../../domain/aggregates/card.aggregate';
import type { IEventStore } from 'src/shared/event-sourcing/event-store';
import type { ISnapshotStore } from 'src/shared/event-sourcing/snapshot-store';

@Injectable()
export class CardRepository implements ICardRepository {
  constructor(
    @Inject('CARD_EVENT_STORE') private readonly eventStore: IEventStore,
    @Inject('SNAPSHOT_STORE') private readonly snapshotStore: ISnapshotStore,
  ) {}

  async save(card: CardAggregate): Promise<void> {
    const events = card.pullUncommittedEvents();
    if (events.length === 0) return;

    await this.eventStore.append(
      card.aggregateId,
      events,
      card.currentVersion - events.length,
    );

    await this.snapshotStore.save(card.aggregateId, card);
  }

  async findById(id: string): Promise<CardAggregate | null> {
    const card = new CardAggregate(id);

    const snapshot = await this.snapshotStore.load(id);
    if (snapshot) {
      Object.assign(card, snapshot);
    }

    const events = await this.eventStore.load(id);
    const eventsToApply = snapshot
      ? events.filter((e) => e.metadata.version > (card.currentVersion || 0))
      : events;

    card.loadFromHistory(eventsToApply);

    return card;
  }
}
