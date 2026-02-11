/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { Inject, Injectable } from '@nestjs/common';
import type { RedisCachePort } from '../../../application/ports/redis-cache.port';

@Injectable()
export class TransactionSnapshotService {
  constructor(
    @Inject('RedisCachePort')
    private readonly redis: RedisCachePort,
  ) {}

  async save(
    transactionId: string,
    data: any,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redis.set(`tx-snapshot:${transactionId}`, data, ttlSeconds);
  }

  async get(transactionId: string): Promise<any | null> {
    return this.redis.get<any>(`tx-snapshot:${transactionId}`);
  }
}
