/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { DomainEvent } from './domain-event';
import type { IEventMapper } from './event-mapper.interface';

export interface IEventStore {
  append(
    aggregateId: string,
    events: DomainEvent[],
    expectedVersion: number,
  ): Promise<void>;
  load(aggregateId: string): Promise<DomainEvent[]>;
}

@Injectable()
export class PostgresEventStore implements IEventStore {
  private readonly logger = new Logger(PostgresEventStore.name);

  constructor(
    @Inject('DATABASE_POOL') private readonly pool: Pool,
    @Inject('EVENT_MAPPER') private readonly mapper: IEventMapper,
  ) {}

  async append(
    aggregateId: string,
    events: DomainEvent[],
    _expectedVersion: number,
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Concurrency check could be added here checking existing version

      for (const event of events) {
        const { payload, metadata } = this.mapper.toPersistence(event);
        await client.query(
          `INSERT INTO event_store 
           (id, aggregate_id, aggregate_type, version, event_name, payload, metadata, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            metadata.eventId,
            metadata.aggregateId,
            metadata.aggregateType,
            metadata.version,
            event.getEventName(),
            JSON.stringify(payload),
            JSON.stringify(metadata),
            metadata.occurredAt,
          ],
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(
        `Failed to append events for aggregate ${aggregateId}`,
        error,
      );
      throw error;
    } finally {
      client.release();
    }
  }

  async load(aggregateId: string): Promise<DomainEvent[]> {
    const result = await this.pool.query(
      `SELECT * FROM event_store WHERE aggregate_id = $1 ORDER BY version ASC`,
      [aggregateId],
    );

    return result.rows.map((row) => this.mapper.toDomain(row));
  }
}
