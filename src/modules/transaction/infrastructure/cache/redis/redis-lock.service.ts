import { Injectable } from '@nestjs/common';
import { redisClient } from 'src/shared/redis/redis.client';

@Injectable()
export class RedisLockService {
  async acquire(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await redisClient.call(
      'SET',
      key,
      '1',
      'NX',
      'EX',
      ttlSeconds.toString(),
    );

    return result === 'OK';
  }

  async release(key: string): Promise<void> {
    await redisClient.del(key);
  }
}
