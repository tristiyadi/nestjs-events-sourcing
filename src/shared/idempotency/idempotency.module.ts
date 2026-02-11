import { Module } from '@nestjs/common';
import { IdempotencyInterceptor } from './idempotency.interceptor';
// Assuming Redis module is globally available or we need to import it.
// We'll rely on the existing Redis setup in the project, likely via a shared module.

@Module({
  providers: [IdempotencyInterceptor],
  exports: [IdempotencyInterceptor],
})
export class IdempotencyModule {}
