/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable } from '@nestjs/common';
import { ITransactionRepository } from '../../domain/repositories/transaction-repository.interface';
import { TransactionAggregate } from '../../domain/aggregates/transaction.aggregate';
import type { IEventStore } from 'src/shared/event-sourcing/event-store';
import type { ISnapshotStore } from 'src/shared/event-sourcing/snapshot-store';

@Injectable()
export class TransactionRepository implements ITransactionRepository {
  constructor(
    @Inject('EVENT_STORE') private readonly eventStore: IEventStore,
    @Inject('SNAPSHOT_STORE') private readonly snapshotStore: ISnapshotStore,
  ) {}

  async save(transaction: TransactionAggregate): Promise<void> {
    const events = transaction.pullUncommittedEvents();
    if (events.length === 0) return;

    await this.eventStore.append(
      transaction.aggregateId,
      events,
      transaction.currentVersion - events.length,
    );

    await this.snapshotStore.save(transaction.aggregateId, transaction);
  }

  async findById(id: string): Promise<TransactionAggregate | null> {
    const transaction = new TransactionAggregate(id);

    const snapshot = await this.snapshotStore.load(id);
    if (snapshot) {
      Object.assign(transaction, snapshot);
    }

    const events = await this.eventStore.load(id);
    const eventsToApply = snapshot
      ? events.filter(
          (e) => e.metadata.version > (transaction.currentVersion || 0),
        )
      : events;

    transaction.loadFromHistory(eventsToApply);

    return transaction;
  }
}
