import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventStorePort } from 'src/modules/transaction/application/ports/event-store.port';
import { DomainEvent } from 'src/shared/kernel/domain-event';
import { Pool } from 'pg';
import { EventMapper } from '../../mappers/event.mapper';

@Injectable()
export class EventStoreRepository implements EventStorePort {
  private readonly logger = new Logger(EventStoreRepository.name);

  constructor(
    @Inject(Pool)
    private readonly pool: Pool,
    private readonly mapper: EventMapper,
  ) {}

  async load(aggregateId: string): Promise<DomainEvent[]> {
    this.logger.log(`Loading events for aggregate ${aggregateId}`);
    const result = await this.pool.query(
      `SELECT * FROM event_store
            WHERE aggregate_id = $1
            ORDER BY version ASC`,
      [aggregateId],
    );
    this.logger.log(
      `Loaded ${result.rowCount} events for aggregate ${aggregateId}`,
    );
    return result.rows.map((row) => this.mapper.toDomain(row));
  }

  async append(
    aggregateId: string,
    expectedVersion: number,
    events: DomainEvent[],
  ): Promise<void> {
    this.logger.log(
      `Appending ${events.length} events for aggregate ${aggregateId}`,
    );
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const event of events) {
        this.logger.log(
          `Inserting event ${event.getEventName()} version ${event.metadata.version}`,
        );
        await client.query(
          `
                    INSERT INTO event_store
                    (id, aggregate_id, aggregate_type, version, event_name, payload, metadata)
                    VALUES ($1,$2,$3,$4,$5,$6,$7)
                    `,
          [
            event.metadata.eventId,
            event.metadata.aggregateId,
            event.metadata.aggregateType,
            event.metadata.version,
            event.getEventName(),
            event.payload,
            event.metadata,
          ],
        );
      }
      await client.query('COMMIT');
      this.logger.log(
        `Successfully committed ${events.length} events for aggregate ${aggregateId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to append events for aggregate ${aggregateId}`,
        error,
      );
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
