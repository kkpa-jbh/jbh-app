# Balance History Page

## Overview

The Balance History page allows users to analyze their financial performance over time. Users can view monthly balance trends for individual products or across all products, helping them understand how their investments, savings, and other financial instruments are performing.

---

## User Interface Components

### 1. Filter Panel

**Purpose**: Allows users to select which data to view and the time period.

| Field | Description |
|-------|-------------|
| **Product** | Dropdown to select a specific product or "All Products" to view aggregated data |
| **Start Period** | The beginning month/year of the analysis period (e.g., "Sep 2024") |
| **End Period** | The ending month/year of the analysis period (e.g., "Feb 2025") |
| **Apply Filter** | Button to load data based on selected criteria |

**User Understanding**:
- Selecting a specific product shows only that product's balance history
- Selecting "All Products" shows aggregated data across all financial products
- The date range determines which months are included in the analysis

---

### 2. Summary Cards

**Purpose**: Provide at-a-glance key metrics for the selected period.

#### Card 1: Total Balance
- **Icon**: Wallet
- **What it shows**: The current total balance at the end of the selected period
- **User Understanding**: "This is how much money I have now across the selected product(s)"
- **For single product**: The closing balance of the latest month
- **For all products**: Sum of closing balances across all products for the latest month

#### Card 2: Period Change
- **Icon**: Trending Up
- **What it shows**: The monetary change and percentage change over the selected period
- **User Understanding**: "This is how much my balance grew (or shrank) during this period"
- **Color coding**:
  - Green (+): Balance increased
  - Red (-): Balance decreased
  - Neutral (0): No change
- **Calculation**: (Last closing balance) - (First opening balance)

#### Card 3: Average Growth Rate
- **Icon**: Stats Chart
- **What it shows**: The average monthly growth rate across the period
- **User Understanding**: "On average, my balance grew by this percentage each month"
- **Color coding**:
  - Green (+): Positive average growth
  - Red (-): Negative average growth
- **For all products**: Weighted average based on balance size

#### Card 4: Total Movements
- **Icon**: Swap Vertical
- **What it shows**: The total number of transactions/movements during the period
- **User Understanding**: "This is how many deposits, withdrawals, or other transactions occurred"

---

### 3. Balance Trend Chart

**Purpose**: Visual representation of balance changes over time.

**What it shows**:
- X-axis: Time periods (months)
- Y-axis: Balance amount in currency
- Line(s): Balance trend over time

**User Understanding**:
- **Single Product View**: One line showing how that product's balance changed month-to-month
- **All Products View**: Multiple lines (one per product) showing each product's individual trend
  - Legend displays product names to identify each line
  - Different colors distinguish between products

**Reading the chart**:
- Upward slope = Balance increasing
- Downward slope = Balance decreasing
- Flat line = Balance stable
- Steep changes = Significant deposits/withdrawals or market movements

---

### 4. Balance History Table

**Purpose**: Detailed month-by-month breakdown of all balance data.

#### Desktop View (Table Format)

| Column | Description | User Understanding |
|--------|-------------|-------------------|
| **Period** | Month and year (e.g., "Jan 2025") | "Which month this row represents" |
| **Product** | Product name (only shown in "All Products" view) | "Which product this data belongs to" |
| **Opening** | Balance at the start of the month | "What I had at the beginning of this month" |
| **Closing** | Balance at the end of the month | "What I had at the end of this month" |
| **Profit** | Net profit/loss for the month | "How much I gained or lost this month" |
| **Growth** | Percentage growth for the month | "The percentage my balance changed" |
| **Movements** | Number of transactions | "How many transactions happened" |
| **Status** | Special indicators (Gap, Official) | "Any special notes about this period" |

#### Mobile View (Card Format)

Each month is displayed as a card with:
- Header showing the period and product name (when viewing all products)
- Status badges (Gap, Official)
- All the same data fields in a compact layout

#### Status Badges

| Badge | Meaning | User Understanding |
|-------|---------|-------------------|
| **Gap** | No data was recorded for this period | "I didn't have this product or no activity occurred" |
| **Official** | Data comes from an official report/statement | "This data is verified from my bank/institution statement" |

#### Color Coding

- **Green text**: Positive profit/growth (money gained)
- **Red text**: Negative profit/growth (money lost)
- **Neutral text**: Zero change

---

## View Modes

### Single Product View

When the user selects a specific product:
- Summary cards show metrics for that product only
- Chart displays one line for the selected product
- Table shows only rows for that product (no Product column)
- Best for: Analyzing one investment or account in detail

### All Products View

When the user selects "All Products":
- Summary cards show aggregated metrics across all products
- Chart displays multiple lines (one per product) with a legend
- Table shows all products with a Product column to identify each row
- Best for: Getting a complete picture of financial health, comparing product performance

---

## Common User Questions

**Q: Why is my Total Balance showing $0?**
A: This could mean no data exists for the selected period, or all products have zero balance.

**Q: What does a "Gap" badge mean?**
A: The system didn't record data for that month. This could be because the product didn't exist yet, was closed, or there was simply no activity.

**Q: How is Average Growth calculated?**
A: For a single product, it's the average of all monthly growth rates. For all products, it's a weighted average where products with larger balances have more influence.

**Q: Why do I see multiple rows for the same month?**
A: In "All Products" view, each product has its own row per month. Look at the Product column to identify which product each row belongs to.

---

## API Response Documentation

See [API Response Schema](./api-response-schema.md) for complete technical documentation of the `BalanceHistoryResponse` structure.
