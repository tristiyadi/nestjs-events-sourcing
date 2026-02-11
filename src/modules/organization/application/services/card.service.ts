/* eslint-disable @typescript-eslint/no-unused-vars */
import { EventMetadataFactory } from 'src/shared/kernel/event-metadata.factory';
import { CardAggregate } from '../../domain/aggregates/card.aggregate';
import { CreateCardCommand } from '../commands/card/create-card.command';
import type { EventBusPort } from '../ports/event-bus.port';
import { CardResult } from '../result/card-result';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { IOrganizationRepository } from '../../domain/repositories/organization-repository.interface';
import type { ICardRepository } from '../../domain/repositories/card-repository.interface';

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);
  constructor(
    @Inject('CARD_REPOSITORY')
    private readonly cardRepository: ICardRepository,
    @Inject('ORGANIZATION_REPOSITORY')
    private readonly organizationRepository: IOrganizationRepository,
    @Inject('EventBusPort')
    private readonly eventBus: EventBusPort,
  ) {}

  async CreateCard(command: CreateCardCommand): Promise<CardResult> {
    const organization = await this.organizationRepository.findById(
      command.organizationId,
    );
    if (!organization) {
      throw new NotFoundException(
        `Organization ${command.organizationId} not found`,
      );
    }
    const card = new CardAggregate(command.id);
    const meta = {
      correlationId: command.correlationId,
      causationId: command.id,
    };
    card.create(
      command.number,
      command.organizationId,
      command.dailyLimit,
      command.monthlyLimit,
      EventMetadataFactory.next(card, meta),
    );
    this.logger.debug(`Card created successfully: ${command.id}`);
    let message: string;
    let status = 'success';
    try {
      const events = [...card.uncommittedEvents];
      await this.cardRepository.save(card);
      await this.eventBus.publish(events);
      this.logger.debug(
        `Events CreateCard published successfully: ${command.id}`,
      );
      message = `Card Number : ${command.number} registered successfully`;
    } catch (err) {
      message = (err as Error).message;
      status = 'failed';
      this.logger.error(
        `Failed to publish events CreateCard: ${(err as Error).message}`,
        err,
      );
    }
    return {
      cardId: command.id,
      correlationId: command.correlationId,
      status: status,
      message: message,
      occurredAt: new Date(),
    };
  }
}
