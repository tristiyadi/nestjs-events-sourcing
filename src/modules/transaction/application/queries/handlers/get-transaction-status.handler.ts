/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { TransactionReadPort } from '../../ports/transaction-read.port';
import { GetTransactionStatusQuery } from '../get-transaction-status.query';
import { TransactionSnapshotService } from '../../../infrastructure/cache/redis/transaction-snapshot.service';

@Injectable()
export class GetTransactionStatusHandler {
  private readonly logger = new Logger(GetTransactionStatusHandler.name);
  constructor(
    @Inject('TransactionReadPort')
    private readonly readRepo: TransactionReadPort,
    private readonly snapshotService: TransactionSnapshotService,
  ) {}

  async execute(query: GetTransactionStatusQuery) {
    this.logger.debug(
      `Getting transaction status for id: ${query.transactionId}`,
    );
    // 1. Try Fast Track (Redis)
    const cachedResult = await this.snapshotService.get(query.transactionId);
    if (cachedResult) {
      this.logger.debug(
        `GetTransactionStatusHandler: Served from Redis for ${query.transactionId}`,
      );
      return cachedResult;
    }

    // 2. Fallback to Read Model (Postgres)
    try {
      this.logger.debug(
        `GetTransactionStatusHandler: Falling back to Postgres for ${query.transactionId}`,
      );
      const result = await this.readRepo.getStatus(query.transactionId);
      if (result == null) {
        throw new NotFoundException(
          `Transaction ${query.transactionId} not found`,
        );
      }
      return result;
    } catch (error) {
      this.logger.error(
        `GetTransactionStatusHandler: Error falling back to Postgres for ${query.transactionId}`,
        error,
      );
      throw error;
    }
  }
}
