/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { AggregateRoot } from './aggregate-root';

export interface ISnapshotStore {
  save(aggregateId: string, aggregate: AggregateRoot): Promise<void>;
  load(aggregateId: string): Promise<any | null>; // Returns the raw state or serialized aggregate
}

@Injectable()
export class RedisSnapshotStore implements ISnapshotStore {
  private readonly logger = new Logger(RedisSnapshotStore.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async save(aggregateId: string, aggregate: AggregateRoot): Promise<void> {
    const key = `snapshot:${aggregateId}`;
    const state = JSON.stringify(aggregate); // Simple serialization
    // This assumes AggregateRoot properties are sufficient to restore state
    // In practice, we might need a specific toSnapshot/fromSnapshot method on AggregateRoot

    await this.redis.set(key, state);
    // Optional: Set generic TTL?
  }

  async load(aggregateId: string): Promise<any | null> {
    const key = `snapshot:${aggregateId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }
}
