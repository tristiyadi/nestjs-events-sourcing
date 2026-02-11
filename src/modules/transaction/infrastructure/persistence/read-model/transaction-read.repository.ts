/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { TransactionReadPort } from 'src/modules/transaction/application/ports/transaction-read.port';

@Injectable()
export class TransactionReadRepository implements TransactionReadPort {
  constructor(
    @Inject(Pool)
    private readonly pool: Pool,
  ) {}
  async getStatus(transactionId: string): Promise<{
    transactionId: string;
    status: string;
    version: number;
    updatedAt: Date;
  } | null> {
    const res = await this.pool.query(
      `SELECT * FROM transaction_read WHERE transaction_id = $1`,
      [transactionId],
    );

    return res.rows[0] ?? null;
  }
}
