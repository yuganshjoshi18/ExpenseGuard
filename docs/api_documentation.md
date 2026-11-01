# API Documentation

## Base URL
- Development: `http://localhost:3001/api`
- Production: `https://api.expenseguard.example.com/api`

## Authentication
Currently no authentication required. Future versions will implement JWT-based authentication.

## Headers
```
Content-Type: application/json
```

## Error Responses
All errors follow a consistent format:
```json
{
  "error": "Error message",
  "details": [...]
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (duplicate)
- `500` - Internal Server Error

---

## Transactions

### List Transactions
**GET** `/transactions`

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page (max 100) |
| sortBy | string | date | Sort field: date, amount, title, createdAt |
| sortOrder | string | desc | Sort order: asc, desc |
| type | string | - | Filter by type: INCOME, EXPENSE |
| categoryId | string | - | Filter by category ID |
| startDate | string | - | Filter by start date (ISO 8601) |
| endDate | string | - | Filter by end date (ISO 8601) |
| search | string | - | Search in title and description |

#### Response
```json
{
  "data": [
    {
      "id": "clx123...",
      "title": "Grocery Shopping",
      "amount": "120.50",
      "type": "EXPENSE",
      "categoryId": "clx456...",
      "category": {
        "id": "clx456...",
        "name": "Food",
        "color": "#ef4444"
      },
      "date": "2024-01-15T10:00:00.000Z",
      "description": "Weekly groceries",
      "paymentMethod": "CARD",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

### Create Transaction
**POST** `/transactions`

#### Request Body
```json
{
  "title": "Grocery Shopping",
  "amount": "120.50",
  "type": "EXPENSE",
  "categoryId": "clx456...",
  "date": "2024-01-15T10:00:00.000Z",
  "description": "Weekly groceries",
  "paymentMethod": "CARD"
}
```

#### Validation Rules
- `title`: Required, 1-200 characters
- `amount`: Required, positive decimal string (max 2 decimal places)
- `type`: Required, enum: INCOME, EXPENSE
- `categoryId`: Required, valid CUID
- `date`: Required, valid ISO 8601 datetime
- `description`: Optional, max 1000 characters
- `paymentMethod`: Optional, enum: CASH, CARD, BANK_TRANSFER, UPI, OTHER

### Get Transaction
**GET** `/transactions/:id`

### Update Transaction
**PUT** `/transactions/:id`

#### Request Body (all fields optional)
```json
{
  "title": "Updated Title",
  "amount": "150.00",
  "type": "EXPENSE",
  "categoryId": "clx456...",
  "date": "2024-01-15T10:00:00.000Z",
  "description": "Updated description",
  "paymentMethod": "CARD"
}
```

### Delete Transaction
**DELETE** `/transactions/:id`

### Monthly Summary
**GET** `/transactions/monthly-summary`

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| year | integer | Yes | Year (e.g., 2024) |
| month | integer | Yes | Month (1-12) |

#### Response
```json
{
  "income": "5000.00",
  "expense": "1200.50",
  "balance": "3799.50"
}
```

### Category Totals
**GET** `/transactions/category-totals`

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| year | integer | Yes | Year (e.g., 2024) |
| month | integer | Yes | Month (1-12) |

#### Response
```json
[
  {
    "categoryId": "clx456...",
    "categoryName": "Food",
    "amount": "450.00",
    "type": "EXPENSE"
  }
]
```

### Yearly Comparison
**GET** `/transactions/yearly-comparison`

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| year | integer | Yes | Year (e.g., 2024) |

#### Response
```json
[
  {
    "month": 1,
    "income": "5000.00",
    "expense": "1200.50"
  }
]
```

### Check Duplicate
**GET** `/transactions/check-duplicate`

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| title | string | Yes | Transaction title |
| amount | string | Yes | Transaction amount |
| date | string | Yes | Transaction date (ISO 8601) |
| categoryId | string | Yes | Category ID |

---

## Categories

### List Categories
**GET** `/categories`

### List Default Categories
**GET** `/categories/default`

### List Categories with Transaction Count
**GET** `/categories/with-count`

### Create Category
**POST** `/categories`

#### Request Body
```json
{
  "name": "Custom Category",
  "description": "My custom category",
  "color": "#8b5cf6",
  "icon": "shopping-bag"
}
```

### Get Category
**GET** `/categories/:id`

### Update Category
**PUT** `/categories/:id`

### Delete Category
**DELETE** `/categories/:id`

---

## Budgets

### List Budgets
**GET** `/budgets`

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| month | integer | Filter by month (1-12) |
| year | integer | Filter by year |

### Create Budget
**POST** `/budgets`

#### Request Body
```json
{
  "categoryId": "clx456...",
  "amount": "500.00",
  "month": 1,
  "year": 2024
}
```

### Get Budget Status
**GET** `/budgets/status`

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| month | integer | Yes | Month (1-12) |
| year | integer | Yes | Year |

#### Response
```json
[
  {
    "budget": { ... },
    "spent": "350.00",
    "remaining": "150.00",
    "percentage": 70,
    "isWarning": false,
    "isCritical": false
  }
]
```

### Get Overall Budget Status
**GET** `/budgets/overall-status`

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| month | integer | Yes | Month (1-12) |
| year | integer | Yes | Year |

#### Response
```json
{
  "totalBudget": "1000.00",
  "totalSpent": "800.00",
  "totalRemaining": "200.00",
  "overallPercentage": 80,
  "isWarning": true,
  "isCritical": false
}
```

### Upsert Budget
**PUT** `/budgets/upsert`

Creates or updates a budget for a category/month/year combination.

### Update Budget
**PUT** `/budgets/:id`

### Delete Budget
**DELETE** `/budgets/:id`

---

## Recurring Expenses

### List Recurring Expenses
**GET** `/recurring-expenses`

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page |
| isActive | boolean | - | Filter by active status |

### Create Recurring Expense
**POST** `/recurring-expenses`

#### Request Body
```json
{
  "title": "Monthly Rent",
  "amount": "1200.00",
  "categoryId": "clx456...",
  "frequency": "MONTHLY",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.999Z",
  "description": "Monthly rent payment",
  "paymentMethod": "BANK_TRANSFER"
}
```

### Get Recurring Expense
**GET** `/recurring-expenses/:id`

### Update Recurring Expense
**PUT** `/recurring-expenses/:id`

### Delete Recurring Expense
**DELETE** `/recurring-expenses/:id`

### Execute Due Recurring Expenses
**POST** `/recurring-expenses/execute-due`

Executes all recurring expenses that are due. Returns array of execution results.

### Get Execution History
**GET** `/recurring-expenses/:id/executions`

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page |

---

## CSV Import/Export

### Import Transactions
**POST** `/csv/import`

#### Request
- Content-Type: `multipart/form-data`
- Field: `file` (CSV file)

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| skipDuplicates | boolean | true | Skip duplicate transactions |

#### Response
```json
{
  "total": 100,
  "valid": 95,
  "invalid": 3,
  "duplicates": 2,
  "imported": 93,
  "errors": [
    {
      "row": 5,
      "field": "amount",
      "message": "Invalid amount format",
      "value": "abc"
    }
  ],
  "transactions": [...]
}
```

### Export Transactions
**GET** `/csv/export`

Returns CSV file download.

### Download Template
**GET** `/csv/template`

Returns CSV template file.

---

## CSV Format

### Required Columns
```
title,amount,type,category,date,description,paymentMethod
```

### Example
```csv
title,amount,type,category,date,description,paymentMethod
Grocery Shopping,120.50,EXPENSE,Food,2024-01-15,Weekly groceries,CARD
Salary,5000.00,INCOME,Other,2024-01-01,January salary,BANK_TRANSFER
```

### Supported Date Formats
- YYYY-MM-DD (2024-01-15)
- DD/MM/YYYY (15/01/2024)
- MM/DD/YYYY (01/15/2024)
- DD-MM-YYYY (15-01-2024)
- YYYY/MM/DD (2024/01/15)
- DD.MM.YYYY (15.01.2024)

### Valid Categories
Must match existing category names (case-insensitive):
- Food, Transportation, Shopping, Entertainment, Healthcare, Education, Bills, Rent, Travel, Other
- Plus any custom categories

### Valid Types
- INCOME
- EXPENSE

### Valid Payment Methods
- CASH, CARD, BANK_TRANSFER, UPI, OTHER (optional)