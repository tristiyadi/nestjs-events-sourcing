/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
export class TransactionMapper {
  toResponse(entity: any) {
    return {
      transactionId: entity.id,
      status: entity.status,
    };
  }
}
