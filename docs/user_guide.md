# User Guide

## Getting Started

### Dashboard
The Dashboard is your financial command center. It shows:
- **Total Income**: All income for the current month
- **Total Expenses**: All expenses for the current month
- **Available Balance**: Income minus expenses
- **Monthly Savings**: How much you're saving
- **Charts**: Visual breakdown of spending patterns
- **Recent Transactions**: Latest 5 transactions
- **Budget Status**: Budget warnings and alerts
- **Upcoming Recurring**: Next recurring expenses

### Transactions
Manage all your income and expense transactions.

#### Adding a Transaction
1. Click "Add Transaction"
2. Fill in:
   - **Title**: Description (e.g., "Grocery Shopping")
   - **Amount**: Positive number (e.g., 120.50)
   - **Type**: Income or Expense
   - **Category**: Select from list
   - **Date**: When it occurred
   - **Description**: Optional details
   - **Payment Method**: Optional
3. Click "Create"

#### Filtering Transactions
- **Search**: Type to search titles/descriptions
- **Type**: Filter by Income/Expense
- **Category**: Filter by category
- **Date Range**: Set start and end dates

#### Editing/Deleting
- Click "Edit" on any transaction to modify
- Click "Delete" to remove (with confirmation)

### Categories
Organize transactions with categories.

#### Default Categories
10 built-in categories: Food, Transportation, Shopping, Entertainment, Healthcare, Education, Bills, Rent, Travel, Other

#### Creating Custom Categories
1. Click "Add Category"
2. Enter name, description, color, icon
3. Click "Create"

#### Managing Categories
- Edit name, color, description
- Delete custom categories (default categories cannot be deleted)

### Budgets
Set spending limits by category and month.

#### Creating a Budget
1. Click "Add Budget"
2. Select category, month, year
3. Enter budget amount
3. Click "Create"

#### Budget Status
- **Green**: Under 80% - On track
- **Yellow**: 80-99% - Warning
- **Red**: 100%+ - Over budget

#### Overall Budget
Shows total budget vs total spending across all categories.

### Recurring Expenses
Automate regular payments.

#### Creating Recurring Expense
1. Click "Add Recurring Expense"
2. Fill in:
   - Title, amount, category
   - Frequency: Daily, Weekly, Monthly, Yearly
   - Start date (and optional end date)
   - Description, payment method
3. Click "Create"

#### Managing Recurring Expenses
- Toggle Active/Inactive
- Edit details
- View execution history
- Manual execution with "Execute Due"

### Reports
Deep-dive into your financial data.

#### Monthly View
Select month/year to see:
- Income vs Expense charts
- Category breakdown (pie chart)
- Budget utilization
- Savings rate

#### Yearly Comparison
Select year to compare all 12 months side-by-side.

### Import/Export
Move data in and out of ExpenseGuard.

#### Importing CSV
1. Click "Import Transactions"
2. Select CSV file (max 10MB)
3. Choose "Skip Duplicates" option
3. Click "Import Transactions"
4. Review results:
   - Total rows processed
   - Valid/Invalid/Duplicate counts
   - Error details for failed rows

#### CSV Format
Required columns: `title,amount,type,category,date,description,paymentMethod`

Example:
```csv
title,amount,type,category,date,description,paymentMethod
Grocery Shopping,120.50,EXPENSE,Food,2024-01-15,Weekly groceries,CARD
Salary,5000.00,INCOME,Other,2024-01-01,January salary,BANK_TRANSFER
```

Supported date formats:
- YYYY-MM-DD (2024-01-15)
- DD/MM/YYYY (15/01/2024)
- MM/DD/YYYY (01/15/2024)
- DD-MM-YYYY (15-01-2024)
- YYYY/MM/DD (2024/01/15)
- DD.MM.YYYY (15.01.2024)

#### Exporting CSV
Click "Export All Transactions" to download complete transaction history.

#### Template
Click "Download Template" for a properly formatted CSV template.

### Settings
Customize your experience.

#### Appearance
- **Theme**: Dark, Light, or System
- **Currency**: INR, USD, EUR, GBP
- **Date Format**: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
- **Timezone**: For accurate monthly reporting

#### Notifications
- Email notifications
- Budget alerts (80%/100%)
- Recurring expense reminders
- Weekly/Monthly reports

#### Data Management
- Export all data (backup)
- Delete all data (irreversible)

## Tips & Best Practices

### Accurate Monthly Reports
- Set your timezone correctly in Settings
- Enter transactions on the correct date
- Recurring expenses execute based on your timezone

### Budget Management
- Set realistic budgets based on history
- Review budget warnings weekly
- Adjust budgets monthly as needed

### Recurring Expenses
- Use for fixed costs (rent, subscriptions)
- Set end dates for temporary expenses
- Review execution history monthly

### CSV Import
- Use the template for best results
- Categories must match existing names exactly (case-insensitive)
- Check error report after import
- Duplicates are detected by title+amount+date+category

### Data Safety
- Export data regularly as backup
- Use "Skip Duplicates" when re-importing
- Deleted transactions cannot be recovered

## Keyboard Shortcuts
- `N` - New transaction (when on Transactions page)
- `Esc` - Close modals
- `Tab` - Navigate form fields
- `Enter` - Submit forms

## Troubleshooting

### Import Errors
- "Category not found": Check category name matches exactly
- "Invalid amount": Use numbers only (120.50, not $120.50)
- "Invalid date": Use supported formats
- "Duplicate": Enable "Skip Duplicates" or check existing data

### Budget Not Showing
- Ensure budget exists for selected month/year
- Check category has transactions in that period
- Verify timezone setting

### Recurring Not Executing
- Check "Execute Due" button
- Verify start date has passed
- Check is Active
- Review execution history for errors

## Support
For issues or feature requests, check the GitHub repository or contact support.