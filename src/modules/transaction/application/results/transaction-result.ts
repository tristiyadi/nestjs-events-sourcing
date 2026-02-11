export interface TransactionResult {
  transactionId: string;
  status: string;
  version: number;
  message?: string;
  occurredAt: Date;
}
