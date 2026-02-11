/* eslint-disable no-useless-catch */
import { Injectable, Logger } from '@nestjs/common';
import { UuidUtil } from 'src/shared/utils/uuid.util';
import { ConcurencyLockService } from '../../services/concurrency-lock.service';
import { IdempotencyService } from '../../services/idempotency.service';
import { TransactionService } from '../../services/transaction.service';
import { ProcessTransactionCommand } from '../process-transaction.command';

@Injectable()
export class ProcessTransactionHandler {
  private readonly logger = new Logger(ProcessTransactionHandler.name);
  constructor(
    private readonly idempotencyService: IdempotencyService,
    private readonly transactionService: TransactionService,
    private readonly concurrencyLockService: ConcurencyLockService,
  ) {}
  async execute(command: ProcessTransactionCommand) {
    this.logger.log('ProcessTransactionHandler: Executing command', command);
    const idemKey = `tx-idem:${command.idempotencyKey}`;
    const lockKey = `transaction-lock:org:${command.organizationId}`;
    this.logger.log('ProcessTransactionHandler: Checking idempotency', idemKey);
    const existingTransactionId =
      await this.idempotencyService.getTransactionId(idemKey);
    this.logger.log(
      'ProcessTransactionHandler: Idempotency check result',
      existingTransactionId,
    );
    if (existingTransactionId) {
      return { transactionId: existingTransactionId };
    }
    const transactionId = UuidUtil.generate();
    this.logger.log(
      'ProcessTransactionHandler: Generated transactionId',
      transactionId,
    );
    this.logger.log('ProcessTransactionHandler: Acquiring lock', lockKey);
    const lockAcquired = await this.concurrencyLockService.acquireLock(
      lockKey,
      10,
    );
    this.logger.log('ProcessTransactionHandler: Lock result', lockAcquired);
    if (!lockAcquired) {
      throw new Error('Could not acquire lock for processing transaction');
    }

    try {
      command.transactionId = transactionId;
      const result = await this.transactionService.processTransaction(command);
      await this.idempotencyService.save(idemKey, transactionId, 3600);
      return result;
    } catch (error) {
      throw error;
    } finally {
      await this.concurrencyLockService.releaseLock(lockKey);
    }
  }
}
