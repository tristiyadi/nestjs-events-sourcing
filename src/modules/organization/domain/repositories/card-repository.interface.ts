import { CardAggregate } from '../aggregates/card.aggregate';

export interface ICardRepository {
  save(card: CardAggregate): Promise<void>;
  findById(id: string): Promise<CardAggregate | null>;
}
