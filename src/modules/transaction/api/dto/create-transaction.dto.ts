import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { UuidUtil } from 'src/shared/utils/uuid.util';

export class CreateTransactionDto {
  @ApiProperty({ description: 'Organization id', example: UuidUtil.generate() })
  @IsUUID()
  @IsNotEmpty()
  readonly organizationId: string;

  @ApiProperty({ description: 'Card id', example: UuidUtil.generate() })
  @IsUUID()
  @IsNotEmpty()
  readonly cardId: string;

  @ApiProperty({ description: 'Amount', example: 100, minimum: 0 })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly amount: number;

  @ApiProperty({
    description: 'Idempotency/Transaction key',
    example: 'tx-key-123',
  })
  @IsString()
  @IsNotEmpty()
  readonly transactionKey: string;
}
