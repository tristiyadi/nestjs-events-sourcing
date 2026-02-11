import { Module, Global } from '@nestjs/common';
import { RedisSnapshotStore } from './snapshot-store';

@Global()
@Module({
  providers: [
    {
      provide: 'SNAPSHOT_STORE',
      useClass: RedisSnapshotStore,
    },
  ],
  exports: ['SNAPSHOT_STORE'],
})
export class EventSourcingModule {}
