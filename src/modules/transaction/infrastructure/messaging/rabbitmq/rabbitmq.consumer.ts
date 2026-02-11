/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { TransactionProjection } from '../../persistence/projections/transaction.projection';
import { BalanceProjection } from '../../persistence/projections/balance.projection';

@Controller()
export class RabbitMQConsumer {
  private readonly logger = new Logger(RabbitMQConsumer.name);

  constructor(
    private readonly transactionProjection: TransactionProjection,
    private readonly balanceProjection: BalanceProjection,
  ) {}

  @EventPattern('OrganizationCreatedEvent')
  async handleOrganizationCreated(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(
      `Received OrganizationCreatedEvent for balance initialization`,
    );
    try {
      await this.balanceProjection.projectInitialize(data);
      this.ack(context);
    } catch (error) {
      this.logger.error('Error processing OrganizationCreatedEvent', error);
    }
  }

  @EventPattern('TransactionCreatedEvent')
  async handleTransactionCreated(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`Received TransactionCreatedEvent`);
    try {
      await this.transactionProjection.project(data);
      this.ack(context);
    } catch (error) {
      this.logger.error('Error processing TransactionCreatedEvent', error);
    }
  }

  @EventPattern('TransactionApprovedEvent')
  async handleTransactionApproved(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`Received TransactionApprovedEvent`);
    try {
      await this.transactionProjection.projectUpdate(data);
      this.ack(context);
    } catch (error) {
      this.logger.error('Error processing TransactionApprovedEvent', error);
    }
  }

  @EventPattern('BalanceDeductedEvent')
  async handleBalanceDeducted(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`Received BalanceDeductedEvent`);
    try {
      await this.balanceProjection.project(data);
      this.ack(context);
    } catch (error) {
      this.logger.error('Error processing BalanceDeductedEvent', error);
    }
  }

  @EventPattern('BalanceAddedEvent')
  async handleBalanceAdded(@Payload() data: any, @Ctx() context: RmqContext) {
    this.logger.log(`Received BalanceAddedEvent`);
    try {
      await this.balanceProjection.projectBalanceAdded(data);
      this.ack(context);
    } catch (error) {
      this.logger.error('Error processing BalanceAddedEvent', error);
    }
  }

  private ack(context: RmqContext) {
    const channel: any = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
  }
}
