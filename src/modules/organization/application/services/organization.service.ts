import { Inject, Injectable } from '@nestjs/common';
import { EventMetadataFactory } from 'src/shared/kernel/event-metadata.factory';
import { OrganizationAggregate } from '../../domain/aggregates/organization.aggregate';
import { Balance } from '../../domain/entities/balance.entity';
import { Money } from '../../domain/value-objects/money.vo';
import { CreateOrganizationCommand } from '../commands/organization/create-organization.command';
import { OrganizationResult } from '../result/organization-result';
import type { EventBusPort } from '../ports/event-bus.port';
import { UpdateOrganizationCommand } from '../commands/organization/update-organization.command';
import type { IOrganizationRepository } from '../../domain/repositories/organization-repository.interface';

@Injectable()
export class OrganizationService {
  constructor(
    @Inject('ORGANIZATION_REPOSITORY')
    private readonly organizationRepository: IOrganizationRepository,
    @Inject('EventBusPort')
    private readonly eventBus: EventBusPort,
  ) {}

  async CreateOrganization(
    command: CreateOrganizationCommand,
  ): Promise<OrganizationResult> {
    const Organization = new OrganizationAggregate(command.id);

    const meta = {
      correlationId: command.correlationId,
      causationId: command.id,
    };
    const money = new Money({
      currency: command.currency,
      amount: command.initialBalance,
    });
    const balance = new Balance(money, command.id);
    Organization.create(
      command.name,
      balance,
      EventMetadataFactory.next(Organization, meta),
    );

    let message: string;
    let status = 'success';
    try {
      const events = Organization.uncommittedEvents;
      await this.organizationRepository.save(Organization);
      await this.eventBus.publish(events);
      message = `Organization : ${command.name} registered successfully`;
    } catch (error) {
      message = (error as Error).message;
      status = 'failed';
    }

    return {
      organizationId: command.id,
      organizationName: command.name,
      status: status,
      correlationId: command.correlationId,
      message: message,
      occurredAt: new Date(),
    };
  }

  async UpdateBalance(
    command: UpdateOrganizationCommand,
  ): Promise<OrganizationResult> {
    const Organization = await this.organizationRepository.findById(command.id);
    if (!Organization) {
      throw new Error('Organization not found');
    }

    const meta = {
      correlationId: command.correlationId,
      causationId: command.id,
    };
    let message: string;
    let status = 'success';
    try {
      const money = new Money({
        currency: 'USD',
        amount: command.Balance,
      });
      Organization.addBalance(
        money,
        EventMetadataFactory.next(Organization, meta),
      );

      const events = Organization.uncommittedEvents;
      await this.organizationRepository.save(Organization);
      await this.eventBus.publish(events);

      message = `Balance updated successfully`;
      status = 'success'; // Fixed status to success on success path
    } catch (error) {
      message = (error as Error).message;
      status = 'failed';
    }

    return {
      organizationId: command.id,
      organizationName: '',
      status: status,
      correlationId: command.correlationId,
      message: message,
      occurredAt: new Date(),
    };
  }
}
