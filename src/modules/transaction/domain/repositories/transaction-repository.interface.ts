import { TransactionAggregate } from '../aggregates/transaction.aggregate';

export interface ITransactionRepository {
  save(transaction: TransactionAggregate): Promise<void>;
  findById(id: string): Promise<TransactionAggregate | null>;
}
