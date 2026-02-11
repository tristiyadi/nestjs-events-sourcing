/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { OrganizationAggregate } from '../aggregates/organization.aggregate';

export interface IOrganizationRepository {
  save(organization: OrganizationAggregate): Promise<void>;
  findById(id: string): Promise<OrganizationAggregate | null>;
}
