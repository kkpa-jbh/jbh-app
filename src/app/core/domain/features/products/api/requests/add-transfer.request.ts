export interface AddTransferRequest {
  toAccountId: string;
  totalAmount: number;
  transferDate: string; // ISO date YYYY-MM-DD
}
