# ExpenseGuard

A full-stack expense tracking application built with React, Express, PostgreSQL, and TypeScript. Features comprehensive financial management including transactions, budgets, recurring expenses, categories, and detailed reporting with CSV import/export capabilities.

## Features

- **Transaction Management**: Complete CRUD operations with search, filter, sort, and pagination
- **Categories**: Default and custom categories with color coding
- **Budgets**: Monthly category-wise budgets with warnings at 80% and critical alerts at 100%
- **Recurring Expenses**: Daily, weekly, monthly, yearly recurring expenses with automatic execution and idempotency protection
- **Reports**: Monthly summaries, yearly comparisons, category breakdowns, budget tracking
- **CSV Import/Export**: Full data portability with duplicate detection and error reporting
- **Timezone-Aware**: Accurate monthly reporting with configurable timezone (default: Asia/Kolkata)
- **Decimal Precision**: Financial calculations using decimal.js for accuracy

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for development and building
- Tailwind CSS for styling
- Recharts for data visualization
- React Router for navigation
- Axios for API communication
- Lucide React for icons

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM with PostgreSQL
- Zod for validation
- decimal.js for monetary calculations
- date-fns and date-fns-tz for date handling
- Helmet, CORS, Rate Limiting for security

### Testing
- Jest for unit and integration tests
- React Testing Library for component tests
- Supertest for API tests
- Playwright for E2E tests
- fast-check for property-based tests

### DevOps
- GitHub Actions for CI/CD
- Docker Compose for local development
- ESLint and Prettier for code quality

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- npm 10+

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ExpenseGuard
```

2. Install dependencies:
```bash
npm run install:all
```

3. Set up environment variables:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your database URL and other settings
```

4. Start the database:
```bash
npm run db:up
```

5. Run database migrations:
```bash
npm run prisma:migrate
```

6. Seed the database:
```bash
npm run seed
```

7. Start development servers:
```bash
npm run dev
```

The frontend will be available at http://localhost:5173 and the backend at http://localhost:3001.

## Project Structure

```
ExpenseGuard/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── layouts/         # Layout components
│   │   ├── services/        # API services
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utility functions
│   │   └── tests/           # Frontend tests
│   └── package.json
├── backend/                  # Express backend
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── repositories/    # Data access layer
│   │   ├── middleware/      # Express middleware
│   │   ├── validators/      # Zod validation schemas
│   │   ├── utils/           # Utility functions
│   │   ├── jobs/            # Background jobs
│   │   └── routes/          # API routes
│   ├── prisma/              # Prisma schema and migrations
│   └── tests/               # Backend tests
├── data/                     # Seed data
│   └── seed_transactions.csv
├── reports/                  # Test and coverage reports
├── docs/                     # Documentation
├── .github/workflows/        # GitHub Actions
├── docker-compose.yml
└── package.json              # Root workspace
```

## API Endpoints

### Transactions
- `GET /api/transactions` - List transactions with pagination, filtering, sorting
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/:id` - Get transaction by ID
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/monthly-summary` - Monthly income/expense/balance
- `GET /api/transactions/category-totals` - Category-wise totals
- `GET /api/transactions/yearly-comparison` - Yearly month-by-month comparison

### Categories
- `GET /api/categories` - List all categories
- `GET /api/categories/default` - List default categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Budgets
- `GET /api/budgets` - List budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/upsert` - Create or update budget
- `GET /api/budgets/status` - Budget status with spending
- `GET /api/budgets/overall-status` - Overall budget status

### Recurring Expenses
- `GET /api/recurring-expenses` - List recurring expenses
- `POST /api/recurring-expenses` - Create recurring expense
- `PUT /api/recurring-expenses/:id` - Update recurring expense
- `POST /api/recurring-expenses/execute-due` - Execute due recurring expenses

### CSV Import/Export
- `POST /api/csv/import` - Import transactions from CSV
- `GET /api/csv/export` - Export transactions to CSV
- `GET /api/csv/template` - Download CSV template

## Running Tests

```bash
# Run all tests
npm test

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend

# Run E2E tests
npm run e2e
```

## Generating Coverage Reports

```bash
npm test
# Coverage reports available in reports/coverage/
```

## Environment Variables

### Backend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://postgres:postgres@localhost:5432/expenseguard |
| PORT | Server port | 3001 |
| NODE_ENV | Environment | development |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:5173 |
| REPORTING_TIMEZONE | Timezone for reports | Asia/Kolkata |
| RATE_LIMIT_WINDOW_MS | Rate limit window | 900000 |
| RATE_LIMIT_MAX_REQUESTS | Max requests per window | 100 |
| MAX_FILE_SIZE | Max upload file size | 10485760 |

## License

MIT License - see LICENSE file for details.