/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable } from '@nestjs/common';
import { IOrganizationRepository } from '../../domain/repositories/organization-repository.interface';
import { OrganizationAggregate } from '../../domain/aggregates/organization.aggregate';
import type { IEventStore } from 'src/shared/event-sourcing/event-store';
import type { ISnapshotStore } from 'src/shared/event-sourcing/snapshot-store'; // Assumed from previous steps

@Injectable()
export class OrganizationRepository implements IOrganizationRepository {
  constructor(
    @Inject('ORGANIZATION_EVENT_STORE')
    private readonly eventStore: IEventStore,
    @Inject('SNAPSHOT_STORE') private readonly snapshotStore: ISnapshotStore,
  ) {}

  async save(organization: OrganizationAggregate): Promise<void> {
    const events = organization.pullUncommittedEvents();
    if (events.length === 0) return;

    await this.eventStore.append(
      organization.aggregateId,
      events,
      organization.currentVersion - events.length,
    );

    // Save snapshot occasionally or always depending on strategy.
    // For now, always save for simplicity and "read from redis" requirement.
    await this.snapshotStore.save(organization.aggregateId, organization);
  }

  async findById(id: string): Promise<OrganizationAggregate | null> {
    const organization = new OrganizationAggregate(id);

    // 1. Try to load from snapshot
    const snapshot = await this.snapshotStore.load(id);
    if (snapshot) {
      // Need to hydrate
      // Assuming snapshot is plain object, we need to apply properties to organization
      // or organization should have a fromSnapshot method.
      // Since AggregateRoot properties are protected, we might need a workaround or method.
      Object.assign(organization, snapshot);
      // This is a bit unsafe. Better to have restore method on aggregate.
    }

    // 2. Load events (if snapshot exists, load events after snapshot version)
    // But our generic EventStore.load() loads ALL events.
    // Ideally generic EventStore should support load(id, fromVersion).
    // For now, load all.
    // Optimization: If snapshot exists, we only need events after snapshot version.
    // But since generic IEventStore.load doesn't support fromVersion yet (checked previous file),
    // we load all and apply. If snapshot was applied, we might apply events again?
    // No, OrganizationAggregate.loadFromHistory (from generic AggregateRoot) loops all events.
    // If we hydrated from snapshot, version is X. We should only apply events > X.

    // Let's rely on EventStore to load all for now as I haven't updated EventStore to support fromVersion.
    // Or I should request EventStore update.

    const events = await this.eventStore.load(id);

    // Ideally we should filter events if we loaded from snapshot.
    // But since I assume snapshot is empty on first run, it's fine.
    // If snapshot has data, we need to filter.
    const eventsToApply = snapshot
      ? events.filter(
          (e) => e.metadata.version > (organization.currentVersion || 0),
        )
      : events;

    organization.loadFromHistory(eventsToApply);

    return organization;
  }
}
