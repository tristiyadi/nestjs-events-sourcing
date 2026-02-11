import { Pool } from 'pg';
import { Logger, Injectable, Inject } from '@nestjs/common';
import { BalanceDeductedEvent } from 'src/modules/transaction/domain/events/balance-deducted.event';
import { OrganizationCreatedEvent } from 'src/modules/organization/domain/events/organization-created.event';
import { BalanceAddedEvent } from 'src/modules/organization/domain/events/balance-added.event';

@Injectable()
export class BalanceProjection {
  private readonly logger = new Logger(BalanceProjection.name);

  constructor(
    @Inject(Pool)
    private readonly pool: Pool,
  ) {}

  async projectInitialize(event: OrganizationCreatedEvent) {
    this.logger.log(
      `Projecting OrganizationCreatedEvent for balance initialization: ${event.metadata.aggregateId}`,
    );
    try {
      await this.pool.query(
        `
                INSERT INTO organization_balance (organization_id, organization_name, balance, status, updated_at)
                VALUES ($1, $2, $3, true, now())
                ON CONFLICT (organization_id) DO UPDATE 
                SET balance = $3, organization_name = $2, updated_at = now()
                `,
        [
          event.metadata.aggregateId,
          event.payload.name,
          event.payload.initialBalance,
        ],
      );
    } catch (err) {
      this.logger.error(
        `Failed to project OrganizationCreatedEvent for balance`,
        err,
      );
      throw err;
    }
  }

  async projectBalanceAdded(event: BalanceAddedEvent) {
    this.logger.log(
      `Projecting BalanceAddedEvent for organization ${event.metadata.aggregateId}`,
    );
    try {
      await this.pool.query(
        `
                UPDATE organization_balance
                SET balance = balance + $1, updated_at = now()
                WHERE organization_id = $2
                `,
        [event.payload.amount, event.metadata.aggregateId],
      );
    } catch (err) {
      this.logger.error(`Failed to project BalanceAddedEvent`, err);
      throw err;
    }
  }

  async project(event: BalanceDeductedEvent) {
    this.logger.log(
      `Projecting BalanceDeductedEvent for organization ${event.metadata.aggregateId}`,
    );
    try {
      const result = await this.pool.query(
        `
                UPDATE organization_balance
                SET balance = balance - $1, version = $2
                WHERE organization_id = $3
                `,
        [
          event.payload.amount,
          event.metadata.version,
          event.metadata.aggregateId,
        ],
      );
      this.logger.log(
        `Successfully projected BalanceDeductedEvent. Rows affected: ${result.rowCount}`,
      );
    } catch (err) {
      this.logger.error(`Failed to project BalanceDeductedEvent`, err);
      throw err;
    }
  }
}
