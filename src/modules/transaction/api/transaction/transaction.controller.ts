/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import {
  Controller,
  Post,
  Req,
  Body,
  Get,
  Param,
  Logger,
} from '@nestjs/common';
import { TransactionResponseDto } from '../dto/transaction-response.dto';
import { ProcessTransactionHandler } from '../../application/commands/handlers/process-transaction.handler';
import { GetTransactionStatusHandler } from '../../application/queries/handlers/get-transaction-status.handler';
import { ProcessTransactionCommand } from '../../application/commands/process-transaction.command';
import { UuidUtil } from 'src/shared/utils/uuid.util';
import { Money } from '../../domain/value-objects/money.vo';
import { GetTransactionStatusQuery } from '../../application/queries/get-transaction-status.query';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('transaction')
@Controller('transaction')
export class TransactionController {
  private readonly logger = new Logger(TransactionController.name);
  constructor(
    private readonly commandHandler: ProcessTransactionHandler,
    private readonly queryHandler: GetTransactionStatusHandler,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiBody({ type: CreateTransactionDto })
  @ApiResponse({
    status: 201,
    description: 'Transaction processed',
    type: TransactionResponseDto,
  })
  async createTransaction(@Body() dto: CreateTransactionDto, @Req() req: any) {
    this.logger.log('TransactionController: Received POST request', dto);
    const command: ProcessTransactionCommand = new ProcessTransactionCommand(
      UuidUtil.generate(),
      dto.organizationId,
      dto.cardId,
      new Money({ amount: dto.amount, currency: 'IDR' }),
      dto.transactionKey,
      req.correlationId,
    );
    const result = await this.commandHandler.execute(command);
    return { transactionId: result.transactionId };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction status' })
  @ApiResponse({
    status: 200,
    description: 'Transaction status',
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  getTransaction(@Param('id') transactionId: string, @Req() req: any) {
    return this.queryHandler.execute(
      new GetTransactionStatusQuery(transactionId),
    );
  }
}
