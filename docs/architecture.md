# Architecture Documentation

## Overview

ExpenseGuard follows a clean, modular architecture with clear separation of concerns between the frontend and backend, and within each layer.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      React Frontend (Vite)                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐  │
│  │   Pages     │ │ Components  │ │   Hooks     │ │ Services │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                        HTTP/REST API
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express Backend (Node.js)                    │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌────────────────┐  │
│  │ Routes   │ │Middleware│ │ Controllers│ │   Services     │  │
│  └──────────┘ └──────────┘ └────────────┘ └────────────────┘  │
│  ┌────────────────┐ ┌────────────────┐ ┌──────────────────┐  │
│  │  Repositories  │ │   Validators   │ │      Jobs        │  │
│  └────────────────┘ └────────────────┘ └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │Transactions│ │Categories│ │ Budgets  │ │ RecurringExpenses│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Component Structure
- **Pages**: Top-level route components (Dashboard, Transactions, Categories, Budgets, RecurringExpenses, Reports, ImportExport, Settings)
- **Layouts**: Shared layout components (Layout with sidebar navigation)
- **Components**: Reusable UI components organized by feature
  - `ui/`: Basic UI primitives (Button, Input, Select, Modal, Card, LoadingSpinner)
  - `forms/`: Form components (TransactionForm, CategoryForm, BudgetForm, RecurringExpenseForm)
  - `charts/`: Chart components (MonthlyChart, IncomeExpenseChart, CategoryChart)
  - Feature-specific components (StatCard, RecentTransactions, BudgetWarnings, UpcomingRecurring)

### State Management
- React's built-in `useState` and `useEffect` for local component state
- Custom hooks for shared logic (data fetching, form handling)
- No external state management library (Redux, Zustand) - kept simple

### Data Fetching
- Axios-based API client in `src/services/api.ts`
- Each domain has its own API object (transactionApi, categoryApi, budgetApi, etc.)
- Automatic error handling and request/response interceptors

### Styling
- Tailwind CSS with custom design system
- Dark mode by default with CSS variables for theming
- Component-specific styles using Tailwind utility classes

## Backend Architecture

### Layered Architecture

```
Routes → Controllers → Services → Repositories → Database
                ↓
          Validators (Zod)
                ↓
          Middleware (Auth, Logging, Error Handling)
```

### Controllers (`src/controllers/`)
- Handle HTTP requests and responses
- Delegate business logic to services
- Use `asyncHandler` wrapper for error handling
- Return appropriate HTTP status codes

### Services (`src/services/`)
- Contain business logic
- Coordinate between repositories
- Handle transactions and complex operations
- Independent of HTTP layer

### Repositories (`src/repositories/`)
- Data access layer
- Encapsulate Prisma queries
- Provide clean interface for services
- Handle pagination, filtering, sorting

### Validators (`src/validators/`)
- Zod schemas for request validation
- Separate schemas for create, update, query
- Reusable across controllers

### Middleware (`src/middleware/`)
- `errorHandler`: Centralized error handling
- `requestLogger`: HTTP request logging
- Future: authentication, rate limiting

### Jobs (`src/jobs/`)
- Background tasks (recurring expense execution)
- Scheduled via cron or manual triggers

## Database Design

### Core Tables

#### Categories
- `id` (CUID)
- `name` (unique)
- `description`
- `color` (hex)
- `icon` (Lucide icon name)
- `isDefault` (boolean)
- `createdAt`, `updatedAt`

#### Transactions
- `id` (CUID)
- `title`
- `amount` (Decimal 15,2)
- `type` (INCOME/EXPENSE)
- `categoryId` (FK)
- `date` (DateTime UTC)
- `description`
- `paymentMethod`
- `createdAt`, `updatedAt`
- Indexes: date, categoryId, type

#### Budgets
- `id` (CUID)
- `categoryId` (FK)
- `amount` (Decimal 15,2)
- `month` (1-12)
- `year`
- `createdAt`, `updatedAt`
- Unique constraint: categoryId + month + year

#### Recurring Expenses
- `id` (CUID)
- `title`
- `amount` (Decimal 15,2)
- `categoryId` (FK)
- `frequency` (DAILY/WEEKLY/MONTHLY/YEARLY)
- `startDate`
- `endDate` (nullable)
- `nextExecutionAt`
- `isActive`
- `description`
- `paymentMethod`
- `createdAt`, `updatedAt`

#### Recurring Executions
- `id` (CUID)
- `recurringExpenseId` (FK)
- `executedAt`
- `transactionId` (unique, nullable)
- `status` (SUCCESS/FAILED/SKIPPED)
- `errorMessage`

## Key Design Decisions

### Monetary Calculations
- All monetary values stored as `DECIMAL(15,2)` in PostgreSQL
- `decimal.js` used for all calculations in JavaScript
- Never use JavaScript `number` type for money

### Date/Time Handling
- All timestamps stored in UTC
- `date-fns-tz` for timezone conversions
- Reporting timezone configurable (default: Asia/Kolkata)
- Monthly boundaries calculated using timezone-aware date ranges

### Duplicate Prevention
- Database unique constraints where applicable
- Application-level duplicate detection for CSV imports
- Idempotency keys for recurring expense execution

### Error Handling
- Custom `AppError` class for operational errors
- Zod validation errors formatted consistently
- Prisma errors mapped to user-friendly messages
- Structured error responses with details

### Security
- Helmet for security headers
- CORS configured for frontend origin
- Rate limiting on all endpoints
- Input validation on all endpoints
- Parameterized queries via Prisma (SQL injection prevention)

## API Design

### RESTful Conventions
- Resource-based URLs
- Standard HTTP methods
- Consistent response formats
- Proper HTTP status codes

### Pagination
- Cursor-based for large datasets
- Page/limit for standard lists
- Metadata in response (total, page, totalPages)

### Filtering & Sorting
- Query parameters for filters
- Standard sort fields per resource
- Default sorting by date descending

## Deployment Architecture

### Development
- Docker Compose for PostgreSQL
- Concurrent frontend/backend dev servers
- Hot module replacement

### Production Considerations
- Build frontend to static assets
- Serve frontend from Express or CDN
- PostgreSQL connection pooling
- Environment-based configuration
- Health check endpoint
- Structured logging

## Scalability Considerations

### Current Limitations
- Single backend instance
- In-memory rate limiting
- No caching layer

### Future Improvements
- Redis for caching and rate limiting
- Horizontal scaling with load balancer
- Read replicas for reporting queries
- Background job queue (BullMQ)
- CDN for static assets