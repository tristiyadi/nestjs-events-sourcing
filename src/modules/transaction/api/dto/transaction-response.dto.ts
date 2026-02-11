import { ApiProperty } from '@nestjs/swagger';
import { TimeUtil } from 'src/shared/utils/time.util';
import { UuidUtil } from 'src/shared/utils/uuid.util';

export class TransactionResponseDto {
  @ApiProperty({ description: 'Transaction id', example: UuidUtil.generate() })
  transactionId: string;

  @ApiProperty({ description: 'Transaction status', example: 'PENDING' })
  status: string;

  @ApiProperty({ description: 'Correlation id', example: UuidUtil.generate() })
  correlationId?: string;

  @ApiProperty({
    description: 'Timestamp when the response occurred',
    example: TimeUtil.toISOString(),
    required: false,
  })
  occurredAt?: string;

  constructor(partial: Partial<TransactionResponseDto>) {
    Object.assign(this, partial);
  }
}
