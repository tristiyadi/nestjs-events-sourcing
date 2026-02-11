export interface TransactionReadPort {
  getStatus(transactionId: string): Promise<{
    transactionId: string;
    status: string;
    version: number;
    updatedAt: Date;
  } | null>;
}
