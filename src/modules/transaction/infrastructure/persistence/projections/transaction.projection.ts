import { Pool } from 'pg';
import { Logger, Injectable, Inject } from '@nestjs/common';
import { TransactionApprovedEvent } from 'src/modules/transaction/domain/events/transaction-approved.event';
import { TransactionCreatedEvent } from 'src/modules/transaction/domain/events/transaction-created.event';

@Injectable()
export class TransactionProjection {
  private readonly logger = new Logger(TransactionProjection.name);

  constructor(
    @Inject(Pool)
    private readonly pool: Pool,
  ) {}

  async project(event: TransactionCreatedEvent) {
    this.logger.log(
      `Projecting TransactionCreatedEvent for ${event.metadata.aggregateId} (v${event.metadata.version})`,
    );
    try {
      const result = await this.pool.query(
        `
              INSERT INTO transaction_read (transaction_id, card_id, amount, status, version, updated_at)
              VALUES ($1, $2, $3, $4, $5, now())
              ON CONFLICT (transaction_id)
              DO UPDATE SET 
                status = $4,
                version = $5, 
                updated_at = now()
              `,
        [
          event.metadata.aggregateId,
          event.payload.cardId,
          event.payload.amount,
          event.payload.status,
          event.metadata.version,
        ],
      );
      this.logger.log(
        `Successfully projected TransactionCreatedEvent. Rows affected: ${result.rowCount}`,
      );
    } catch (err) {
      this.logger.error(`Failed to project TransactionCreatedEvent`, err);
      throw err;
    }
  }

  async projectUpdate(event: TransactionApprovedEvent) {
    this.logger.log(
      `Projecting TransactionApprovedEvent for ${event.metadata.aggregateId} (v${event.metadata.version})`,
    );
    try {
      const result = await this.pool.query(
        `
           UPDATE transaction_read SET status = $1, updated_at = now(), version = $2
            WHERE transaction_id = $3
              `,
        [
          event.payload.status,
          event.metadata.version,
          event.metadata.aggregateId,
        ],
      );
      this.logger.log(
        `Successfully projected TransactionApprovedEvent. Rows affected: ${result.rowCount}`,
      );
    } catch (err) {
      this.logger.error(`Failed to project TransactionApprovedEvent`, err);
      throw err;
    }
  }
}
