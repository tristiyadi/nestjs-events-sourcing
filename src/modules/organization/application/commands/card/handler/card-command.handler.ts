/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-useless-catch */
import { UuidUtil } from 'src/shared/utils/uuid.util';
import { CardService } from '../../../services/card.service';
import { ConcurencyLockService } from '../../../services/concurrency-lock.service';
import { IdempotencyService } from '../../../services/idempotency.service';
import { CreateCardCommand } from '../create-card.command';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CardCommandHandler {
  private readonly logger = new Logger(CardCommandHandler.name);
  constructor(
    private readonly idempotencyService: IdempotencyService,
    private readonly concurrencyLockService: ConcurencyLockService,
    private readonly cardService: CardService,
  ) {}

  async createCard(command: CreateCardCommand) {
    const lockKey = `transaction-lock:org:${command.organizationId}`;
    try {
      const lockAcquired = await this.concurrencyLockService.acquireLock(
        lockKey,
        10,
      );
      const cardId = UuidUtil.generate();
      command.id = cardId;
      const result = await this.cardService.CreateCard(command);
      return result;
    } catch (error) {
      this.logger.error(error);
      throw error;
    } finally {
      await this.concurrencyLockService.releaseLock(lockKey);
    }
  }
}
