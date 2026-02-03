 Context Summary                                                                              
                                                                                               
  What products are: Financial instruments (savings accounts, investments, loans, credit cards,
   CDTs, real estate) - each with current balance, movement balance, net profit, and growth    
  rate.                                                                                        
                                                                                               
  Current navigation:                                                                          
  - Products → Create | Overview | Transfer                                                    
  - Teams → Create | Overview | Invite                                                         
                                                                                               
  Current Overview page: A grid of cards showing each product's current state (balances,       
  profit/loss, growth rate).                                                                   
                                                                                               
  ---                                                                                          
  My Recommendation: Hybrid Approach                                                           
                                                                                               
  1. New Menu Option + Per-Product Quick Access                                                
                                                                                               
  Add a new submenu item under Products:                                                       
  Products                                                                                     
  ├── Create Product                                                                           
  ├── Overview           ← current page (snapshot view)                                        
  ├── Balance History    ← NEW (analytical/trend view)                                         
  └── Transfer                                                                                 
                                                                                               
  Plus: Add a "View History" action button on each product card in the Overview page that takes
   the user to Balance History pre-filtered for that product.                                  
                                                                                               
  Why this hybrid:                                                                             
  - Global access for users who want to analyze trends across all products or compare them     
  - Contextual access for users viewing a specific product who want to drill into its history  
  - Keeps the Overview page clean (it's a snapshot, not a report)                              
                                                                                               
  ---                                                                                          
  2. Balance History Page Layout                                                               
                                                                                               
  Header Section:                                                                              
  ┌─────────────────────┬───────────────────────────────────────────────┐                      
  │      Component      │                    Purpose                    │                      
  ├─────────────────────┼───────────────────────────────────────────────┤                      
  │ Date range picker   │ Start/end month selection                     │                      
  ├─────────────────────┼───────────────────────────────────────────────┤                      
  │ Product selector    │ "All Products" or specific product (dropdown) │                      
  ├─────────────────────┼───────────────────────────────────────────────┤                      
  │ Apply/Filter button │ Fetch data                                    │                      
  └─────────────────────┴───────────────────────────────────────────────┘                      
  Summary Cards Row (quick glance metrics):                                                    
  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                                
  │ Total Balance   │  │ Period Change   │  │ Avg. Growth     │                                
  │ $45,230.00      │  │ +$2,340.00      │  │ +3.2%           │                                
  │ (end of period) │  │ (green/red)     │  │ (green/red)     │                                
  └─────────────────┘  └─────────────────┘  └─────────────────┘                                
                                                                                               
  Main Data Display - Table (Desktop):                                                         
  Month/Year    │ Product      │ Opening    │ Closing    │ Change      │ % Change              
  ──────────────┼──────────────┼────────────┼────────────┼─────────────┼──────────             
  Jan 2025      │ All Products │ $42,890    │ $43,560    │ +$670       │ +1.56%                
                │ → Savings    │ $12,000    │ $12,340    │ +$340       │ +2.83%                
                │ → Investment │ $30,890    │ $31,220    │ +$330       │ +1.07%                
  ──────────────┼──────────────┼────────────┼────────────┼─────────────┼──────────             
  Feb 2025      │ All Products │ $43,560    │ $45,230    │ +$1,670     │ +3.84%                
  ...                                                                                          
                                                                                               
  When viewing a single product: Hide the Product column, simpler table.                       
                                                                                               
  Main Data Display - Cards (Mobile):                                                          
  ┌─────────────────────────────────────┐                                                      
  │ January 2025                        │                                                      
  ├─────────────────────────────────────┤                                                      
  │ Opening     $42,890.00              │                                                      
  │ Closing     $43,560.00              │                                                      
  │ Change      +$670.00   (+1.56%)  ▲  │                                                      
  └─────────────────────────────────────┘                                                      
                                                                                               
  ---                                                                                          
  3. Why Tables Are Right Here                                                                 
                                                                                               
  You're correct - tables are the best choice for this use case because:                       
                                                                                               
  1. Precision matters - Personal finance users need exact numbers                             
  2. Comparison - Easy to scan across months/products                                          
  3. Scannable - Rows and columns allow quick visual parsing                                   
  4. Mobile-friendly when done right - Use the existing pattern (desktop table → mobile cards) 
  5. Export-friendly - If you later add CSV export, table format maps directly                 
                                                                                               
  Optional enhancement: A small line chart above the table showing the balance trend. This     
  gives:                                                                                       
  - Visual pattern recognition (trending up/down/flat)                                         
  - Quick insight without reading numbers                                                      
  - But the table remains the primary data source                                              
                                                                                               
  ---                                                                                          
  4. Recommended User Flows                                                                    
                                                                                               
  Flow A: Broad Analysis                                                                       
  1. User opens menu → Products → Balance History                                              
  2. Selects date range (last 6 months)                                                        
  3. Keeps "All Products" selected                                                             
  4. Views combined monthly balances + per-product breakdown                                   
                                                                                               
  Flow B: Product-Specific Deep Dive                                                           
  1. User is on Products Overview                                                              
  2. Clicks "View History" on a specific product card                                          
  3. Lands on Balance History pre-filtered for that product                                    
  4. Sees monthly trend for just that product                                                  
                                                                                               
  ---                                                                                          
  5. Summary                                                                                   
  Decision: Where to put it                                                                    
  Recommendation: New "Balance History" submenu item + quick access from product cards         
  ────────────────────────────────────────                                                     
  Decision: Primary display                                                                    
  Recommendation: Table (desktop) / Cards (mobile)                                             
  ────────────────────────────────────────                                                     
  Decision: Optional enhancement                                                               
  Recommendation: Small trend line chart above the table                                       
  ────────────────────────────────────────                                                     
  Decision: Filters                                                                            
  Recommendation: Date range + Product selector (all or single)                                
  ────────────────────────────────────────                                                     
  Decision: Summary metrics                                                                    
  Recommendation: 3 cards showing total, change, and growth %                                  
  This approach:                                                                               
  - ✅ Follows your existing responsive patterns (table ↔ cards)                               
  - ✅ Keeps Overview clean (current state vs. historical)                                     
  - ✅ Provides flexibility (all products or single)                                           
  - ✅ Uses your existing design system (jbh-* classes)                                        
  - ✅ Tables give the precision needed for personal finance                                   
                                                                                               
  ---                                                                                          
  Would you like me to clarify any part of this recommendation, or discuss alternative         
  approaches for any specific section?     