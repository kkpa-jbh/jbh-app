# Balance History API Response Schema

## Endpoint

```
POST /finance/products/monthly-balances/
POST /finance/products/monthly-balances/{productId}
```

## Request Body

```typescript
interface MonthlyBalanceRequest {
  startPeriod: string;  // Format: "YYYY-MM" (e.g., "2024-01")
  endPeriod: string;    // Format: "YYYY-MM" (e.g., "2024-12")
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `startPeriod` | string | Yes | Start of the date range in "YYYY-MM" format |
| `endPeriod` | string | Yes | End of the date range in "YYYY-MM" format |

---

## Response Body

```typescript
interface BalanceHistoryResponseApi {
  summary: BalanceHistorySummary;
  balances: MonthlyBalanceApiResponse[];
}
```

The response contains two main sections:
1. **summary**: Pre-calculated aggregated metrics for the entire period
2. **balances**: Array of individual monthly balance records

---

## Summary Object

```typescript
interface BalanceHistorySummary {
  totalBalance: number;
  periodChange: number;
  periodChangePercent: number;
  avgGrowthRate: number;
  totalMovements: number;
}
```

### Summary Fields

| Field | Type | Description | Calculation |
|-------|------|-------------|-------------|
| `totalBalance` | number | Current total balance at the end of the period | **Single product**: Latest closing balance<br>**All products**: Sum of latest closing balances for each product |
| `periodChange` | number | Net monetary change during the period | **Single product**: Last closing - First opening<br>**All products**: Sum of (last closing - first opening) for each product |
| `periodChangePercent` | number | Percentage change during the period | `(periodChange / sum of first opening balances) × 100` |
| `avgGrowthRate` | number | Average monthly growth rate | **Single product**: Average of all monthly growth rates<br>**All products**: Weighted average: `Σ(growthRate × closingBalance) / Σ(closingBalance)` |
| `totalMovements` | number | Total transaction count | Sum of all `movementCount` values across all records |

### Summary Calculation Examples

#### Single Product Example
```
Period: Jan 2024 - Mar 2024
Jan: Opening $10,000, Closing $10,500, Growth 5%
Feb: Opening $10,500, Closing $11,000, Growth 4.76%
Mar: Opening $11,000, Closing $11,200, Growth 1.82%

totalBalance = $11,200 (Mar closing)
periodChange = $11,200 - $10,000 = $1,200
periodChangePercent = ($1,200 / $10,000) × 100 = 12%
avgGrowthRate = (5 + 4.76 + 1.82) / 3 = 3.86%
```

#### All Products Example
```
Product A - Latest closing: $50,000
Product B - Latest closing: $30,000

totalBalance = $50,000 + $30,000 = $80,000
```

---

## Balance Record Object

```typescript
interface MonthlyBalanceApiResponse {
  // Period identification
  period: string;

  // Balance data
  openingBalance: number;
  closingBalance: number;
  profit: number;
  growthRate: number;
  movementCount: number;

  // Status flags
  isGapPeriod: boolean;
  isOfficialReport: boolean;
  isProfitable: boolean;
  isLoss: boolean;

  // Product identification
  productId: { value: string };
  productName: string;
}
```

### Balance Record Fields

#### Period Identification

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `period` | string | Period identifier in "YYYY-MM" format, used for sorting and filtering | `"2024-01"` |

#### Balance Data

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `openingBalance` | number | Balance at the start of the month (first day) | `10000.00` |
| `closingBalance` | number | Balance at the end of the month (last day) | `10500.00` |
| `profit` | number | Net profit or loss for the month. Positive = gain, Negative = loss | `500.00` or `-200.00` |
| `growthRate` | number | Percentage growth for the month. Calculated as: `((closing - opening) / opening) × 100` | `5.00` (meaning 5%) |
| `movementCount` | number | Number of transactions (deposits, withdrawals, transfers) during the month | `12` |

#### Status Flags

| Field | Type | Description | When True |
|-------|------|-------------|-----------|
| `isGapPeriod` | boolean | Indicates no actual data exists for this period | Product didn't exist, was closed, or had no activity. Data may be interpolated or carried forward. |
| `isOfficialReport` | boolean | Data comes from an official bank/institution statement | User uploaded or synced an official statement for this period |
| `isProfitable` | boolean | Pre-calculated flag indicating positive profit | `profit > 0` |
| `isLoss` | boolean | Pre-calculated flag indicating negative profit | `profit < 0` |

#### Product Identification

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `productId` | object | Unique identifier wrapper for the product (UUID) | `{ "value": "a1b2c3d4-e5f6-..." }` |
| `productName` | string | User-friendly name of the product | `"Main Savings Account"` |

---

## Frontend Domain Model

The frontend maps the API response to domain models:

```typescript
// Result wrapper returned by use cases
interface BalanceHistoryResult {
  summary: BalanceHistorySummary;
  balances: MonthlyBalance[];
}

// Domain model for a single balance record
class MonthlyBalance {
  constructor(
    public readonly period: string,
    public readonly openingBalance: number,
    public readonly closingBalance: number,
    public readonly profit: number,
    public readonly growthRate: number,
    public readonly movementCount: number,
    public readonly isGapPeriod: boolean,
    public readonly isOfficialReport: boolean,
    public readonly productId: string,
    public readonly productName: string,
    public readonly isProfitable: boolean,
    public readonly isLoss: boolean
  ) {}

  static fromApiResponse(response: MonthlyBalanceApiResponse): MonthlyBalance;
}
```

---

## Field Usage by Component

### Summary Cards Component

| Component Element | Field Used | Display |
|-------------------|------------|---------|
| Total Balance card | `summary.totalBalance` | Formatted as currency |
| Period Change card | `summary.periodChange`, `summary.periodChangePercent` | Currency with +/- prefix, percentage in parentheses |
| Avg Growth card | `summary.avgGrowthRate` | Percentage with +/- prefix |
| Total Movements card | `summary.totalMovements` | Integer |

### Balance Chart Component

| Chart Element | Field Used | Purpose |
|---------------|------------|---------|
| Y-axis values | `balance.closingBalance` | Plot the balance line |
| Series grouping | `balance.productId` | Group data by product |
| Legend labels | `balance.productName` | Identify each product line |

### Balance History Table Component

| Table Column | Field Used | Notes |
|--------------|------------|-------|
| Product | `balance.productName` | Only shown in "All Products" view |
| Opening | `balance.openingBalance` | Formatted as currency |
| Closing | `balance.closingBalance` | Formatted as currency |
| Profit | `balance.profit` | Formatted with +/- prefix, color-coded |
| Growth | `balance.growthRate` | Formatted as percentage, color-coded |
| Movements | `balance.movementCount` | Integer |
| Gap badge | `balance.isGapPeriod` | Shown when true |
| Official badge | `balance.isOfficialReport` | Shown when true |
| Row styling | `balance.isGapPeriod` | Gap periods have muted background |

---

## Example API Response

```json
{
  "summary": {
    "totalBalance": 85000.00,
    "periodChange": 5000.00,
    "periodChangePercent": 6.25,
    "avgGrowthRate": 2.08,
    "totalMovements": 45
  },
  "balances": [
    {
      "period": "2024-01",
      "openingBalance": 40000.00,
      "closingBalance": 41000.00,
      "profit": 1000.00,
      "growthRate": 2.50,
      "movementCount": 8,
      "isGapPeriod": false,
      "isOfficialReport": true,
      "isProfitable": true,
      "isLoss": false,
      "productId": { "value": "prod-001" },
      "productName": "Main Savings"
    },
    {
      "period": "2024-01",
      "openingBalance": 35000.00,
      "closingBalance": 36500.00,
      "profit": 1500.00,
      "growthRate": 4.29,
      "movementCount": 5,
      "isGapPeriod": false,
      "isOfficialReport": false,
      "isProfitable": true,
      "isLoss": false,
      "productId": { "value": "prod-002" },
      "productName": "Investment Fund"
    },
    {
      "period": "2024-02",
      "openingBalance": 41000.00,
      "closingBalance": 41500.00,
      "profit": 500.00,
      "growthRate": 1.22,
      "movementCount": 12,
      "isGapPeriod": false,
      "isOfficialReport": false,
      "isProfitable": true,
      "isLoss": false,
      "productId": { "value": "prod-001" },
      "productName": "Main Savings"
    }
  ]
}
```

---

## Notes for Backend Implementation

1. **All calculations must be done on the backend** - The frontend only renders data
2. **Sorting**: Return balances sorted by `period` descending, then by `productId`
3. **Empty periods**: Include gap periods with `isGapPeriod: true` if the user should see continuity
4. **Precision**: Use 2 decimal places for monetary values, reasonable precision for percentages
