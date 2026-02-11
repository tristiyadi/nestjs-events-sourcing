import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Observable, of, tap } from 'rxjs';
import Redis from 'ioredis';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.headers['idempotency-key'];

    if (!idempotencyKey) {
      return next.handle();
    }

    const key = `idempotency:${idempotencyKey}`;
    const cachedResponse = await this.redis.get(key);

    if (cachedResponse) {
      this.logger.log(`Idempotency key hit: ${idempotencyKey}`);
      try {
        return of(JSON.parse(cachedResponse));
      } catch (e) {
        // If parsing fails, maybe it was a simple string or invalid JSON, ignore and proceed or error
        this.logger.warn(
          `Failed to parse cached response for key ${idempotencyKey}`,
        );
      }
    }

    // Mark key as processing to handle concurrent requests with same key?
    // For simplicity, we just cache the result after success.
    // Ideally use setnx with a 'processing' status if strict locking needed.

    return next.handle().pipe(
      tap(async (response) => {
        // Cache the successful response
        await this.redis.set(
          key,
          JSON.stringify(response),
          'EX',
          86400, // 24 hours TTL
        );
      }),
    );
  }
}
