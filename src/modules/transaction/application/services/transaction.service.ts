/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventMetadataFactory } from 'src/shared/kernel/event-metadata.factory';
import { TransactionAggregate } from '../../domain/aggregates/transaction.aggregate';
import { ProcessTransactionCommand } from '../commands/process-transaction.command';
import type { EventBusPort } from '../ports/event-bus.port';
import { TransactionResult } from '../results/transaction-result';
import { TransactionStatus } from '../../domain/value-objects/transaction-status.vo';
import { TransactionSnapshotService } from '../../infrastructure/cache/redis/transaction-snapshot.service';
import type { IOrganizationRepository } from '../../../organization/domain/repositories/organization-repository.interface';
import type { ICardRepository } from '../../../organization/domain/repositories/card-repository.interface';
import type { ITransactionRepository } from '../../domain/repositories/transaction-repository.interface';
import { Money as OrganizationMoney } from '../../../organization/domain/value-objects/money.vo';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);
  constructor(
    @Inject('TRANSACTION_REPOSITORY')
    private readonly transactionRepository: ITransactionRepository,
    @Inject('ORGANIZATION_REPOSITORY')
    private readonly organizationRepository: IOrganizationRepository,
    @Inject('CARD_REPOSITORY')
    private readonly cardRepository: ICardRepository,
    @Inject('EventBusPort')
    private readonly eventBus: EventBusPort,
    private readonly snapshotService: TransactionSnapshotService,
  ) {}

  async processTransaction(
    command: ProcessTransactionCommand,
  ): Promise<TransactionResult> {
    this.logger.log(
      'TransactionService: processTransaction command: ' +
        JSON.stringify(command),
    );

    const Organization = await this.organizationRepository.findById(
      command.organizationId,
    );
    if (!Organization) {
      this.logger.warn(
        `No events found for organization ${command.organizationId}`,
      );
      throw new NotFoundException(
        `Organization ${command.organizationId} not found`,
      );
    }

    const Card = await this.cardRepository.findById(command.cardId);
    if (!Card) {
      this.logger.warn(`No events found for card ${command.cardId}`);
      throw new NotFoundException(`Card ${command.cardId} not found`);
    }

    // Load or create transaction
    let Transaction = await this.transactionRepository.findById(
      command.transactionId,
    );
    if (!Transaction) {
      // Should not happen if findById returns empty aggregate for new ID?
      // My repository impl returns `new TransactionAggregate(id)` if no snapshot/events.
      // So it always returns an instance.
      Transaction = new TransactionAggregate(command.transactionId);
    }

    const meta = {
      correlationId: command.correlationId,
      causationId: command.transactionId,
    };

    // Only create if it's a new transaction (version 0)
    // Assuming version 0 means no events applied yet.
    if (Transaction.currentVersion === 0) {
      Transaction.create(
        command.cardId,
        command.amount.amount,
        TransactionStatus.PENDING,
        EventMetadataFactory.next(Transaction, meta),
      );
    }

    let message: string;
    try {
      Organization.deductBalance(
        new OrganizationMoney(command.amount),
        EventMetadataFactory.next(Organization, meta),
      );
      Card.applyUsage(
        command.amount.amount,
        EventMetadataFactory.next(Card, meta),
      );

      Transaction.approve(EventMetadataFactory.next(Transaction, meta));
      message = `Transaction: ${command.transactionId} success`;
    } catch (error) {
      message = (error as Error).message;
      // Only reject if open
      if (Transaction.status === TransactionStatus.PENDING) {
        Transaction.reject(
          EventMetadataFactory.next(Transaction, meta),
          message,
        );
      }
    }

    this.logger.log('TransactionService: pulling events');
    const organizationEvents = Organization.uncommittedEvents;
    const cardEvents = Card.uncommittedEvents;
    const transactionEvents = Transaction.uncommittedEvents;

    const allEvents = [
      ...organizationEvents,
      ...cardEvents,
      ...transactionEvents,
    ];
    this.logger.log(`TransactionService: gathered ${allEvents.length} events`);

    // Save using repositories
    await this.organizationRepository.save(Organization);
    await this.cardRepository.save(Card);
    await this.transactionRepository.save(Transaction);

    // Publish events to the event bus (RabbitMQ)
    console.log('TransactionService: publishing events to bus');
    if (allEvents.length > 0) {
      await this.eventBus.publish(allEvents);
    }

    console.log('TransactionService: finished processing');
    const result: TransactionResult = {
      transactionId: command.transactionId,
      status: Transaction.status,
      version: Transaction.currentVersion,
      message: message,
      occurredAt: new Date(),
    };

    // Fast status check: save result to Redis using SnapshotService
    await this.snapshotService.save(command.transactionId, result, 600);

    return result;
  }
}
