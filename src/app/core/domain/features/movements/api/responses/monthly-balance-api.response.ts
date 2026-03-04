export interface MonthlyBalanceApiResponse {
  id: number;
  productId: { value: string };
  year: number;
  month: number;
  period: string;
  netGrowthRate: number;
  totalDebits: number;
  totalCredits: number;
  movementBalance: number;
  openingBalance: number;
  closingBalance: number;
  monthlyNetProfit: number;
  totalMovements: number;
  gapPeriod: boolean;
  officialMonthlyReport: boolean;
  monthlyReportedProfit: number;
  incomeWithholdingTaxAmount: number;
  createdAt: string;
  updatedAt: string;
}
