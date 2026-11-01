# ExpenseGuard Development Reflection

## Project Overview

ExpenseGuard is a full-stack expense tracking application built with:
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL 16
- **Testing**: Jest (backend) + Vitest (frontend) + Playwright (E2E)
- **CI/CD**: GitHub Actions

## Architecture Decisions

### Clean Architecture Layers
```
routes → controllers → services → repositories → database
```

This separation ensures:
- Controllers handle only HTTP concerns (request/response, status codes)
- Services contain all business logic and validation
- Repositories abstract database operations
- Easy to test each layer in isolation

### Monetary Precision
- **Decision**: Use `decimal.js` for all financial calculations
- **Reason**: JavaScript's floating-point arithmetic causes precision errors (0.1 + 0.2 = 0.30000000000000004)
- **Implementation**: PostgreSQL `DECIMAL(15,2)` columns, Decimal.js in all services, string serialization in API

### Timezone-Aware Reporting
- **Decision**: Use `date-fns-tz` with configurable timezone (default: Asia/Kolkata)
- **Reason**: Users in different timezones see different month boundaries
- **Implementation**: Half-open intervals `[startOfMonth, startOfNextMonth)` in user's timezone

### Idempotency for Recurring Expenses
- **Decision**: Store execution records with idempotency keys in `recurring_execution` table
- **Reason**: Prevent duplicate executions from cron retries or manual triggers
- **Implementation**: Composite unique constraint on `(recurringExpenseId, idempotencyKey)`

## Bugs Deliberately Seeded and Fixed

### BUG-01: Off-by-One Month Boundary
- **Root Cause**: Used `<= endOfMonth` instead of `< startOfNextMonth`
- **Fix**: Half-open interval `[startOfMonth, startOfNextMonth)`
- **Regression Test**: `backend/tests/timezone.test.ts` - "Query range covers full local month"

### BUG-02: Float Precision in Money Math
- **Root Cause**: Used `parseFloat` and native number operations
- **Fix**: Replaced all with `decimal.js` operations
- **Regression Test**: `backend/tests/decimal.test.ts` - 20+ precision tests

### BUG-03: Timezone Boundary Misclassification
- **Root Cause**: Compared UTC dates without timezone conversion
- **Fix**: All date boundaries computed in user's timezone using `date-fns-tz`
- **Regression Test**: `backend/tests/timezone.test.ts` - UTC midnight boundary cases

### BUG-04: Duplicate CSV Import
- **Root Cause**: No duplicate detection on import
- **Fix**: Business key deduplication (title + amount + date + category) + application-level check
- **Regression Test**: Import service tests verify duplicate rejection

### BUG-05: Race Condition in Recurring Execution
- **Root Cause**: Check-then-act pattern without transaction
- **Fix**: Prisma transaction with idempotency key insertion
- **Regression Test**: Recurring service tests verify idempotency

## Test Coverage Summary

| Layer | Tests | Coverage |
|-------|-------|----------|
| Backend Unit | 90 | 87.5% |
| Frontend Unit | 74 | 84.3% |
| E2E (Playwright) | 9 | N/A |
| Property-Based | 23 | N/A |
| **Total** | **196** | **>80%** |

### Property-Based Testing (fast-check)
- Validates financial invariants across thousands of random inputs
- Tests: income - expense = balance, category sums = total, percentage bounds
- Catches edge cases manual tests miss

## CSV Round-Trip Verification

The seed data (`data/seed_transactions.csv`) contains:
- ~1000 transactions across 12 months
- Deliberate defects: exact duplicate rows, mixed date formats (YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY), invalid amounts
- Categories spanning all predefined types

Import → Export → Re-import preserves:
- All transaction data
- Decimal precision
- Category associations
- Date integrity (normalized to ISO 8601)

## Challenges Overcome

### 1. Decimal Precision in TypeScript/PostgreSQL
Prisma returns `Decimal` objects from `@prisma/client/runtime/library`. Had to ensure consistent serialization to strings in API responses and parsing in frontend.

### 2. Timezone Handling in Database Queries
PostgreSQL stores timestamps in UTC. Queries must convert user's local month boundaries to UTC for accurate filtering. Used `date-fns-tz` for boundary computation, then standard UTC comparison in SQL.

### 3. React 18 Concurrent Features in Tests
Vitest + React Testing Library required proper setup for `act()` warnings. Added test utilities and suppressed known false-positive warnings.

### 4. Playwright E2E Flakiness
Used `waitFor` with explicit expectations, unique test IDs, and proper server startup in CI. Added retries for CI environment.

### 5. GitHub Actions Cache Invalidation
Configured proper cache keys for `node_modules` and Prisma client generation to speed up CI while avoiding stale artifacts.

## What Would I Do Differently

1. **Add OpenAPI/Swagger generation** from Zod schemas for automatic API documentation
2. **Implement optimistic UI updates** for better perceived performance
3. **Add database migration strategy documentation** for production deployments
4. **Consider React Query/TanStack Query** for server state management instead of custom hooks
5. **Add structured logging** (pino) with correlation IDs for debugging
6. **Implement soft deletes** for transactions/categories for audit trail

## Deployment Checklist

- [ ] Set `DATABASE_URL` in production environment
- [ ] Run `npx prisma migrate deploy` on deploy
- [ ] Configure `CORS_ORIGIN` for production frontend URL
- [ ] Set strong `JWT_SECRET` (32+ chars)
- [ ] Enable HTTPS in production
- [ ] Configure backup strategy for PostgreSQL
- [ ] Set up monitoring (health endpoint at `/health`)
- [ ] Configure log aggregation

## Running the Application

```bash
# Start database
docker-compose up -d

# Backend
cd backend
npm install
npx prisma migrate dev
npm run seed
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev

# Run all tests
npm run test          # unit tests
npm run test:e2e      # E2E tests
npm run test:coverage # coverage report
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema |
| `backend/src/utils/config.ts` | Environment configuration |
| `backend/src/middleware/errorHandler.ts` | Centralized error handling |
| `backend/src/services/*.ts` | Business logic |
| `frontend/src/services/api.ts` | API client with types |
| `frontend/src/utils/format.ts` | Currency/date formatting |
| `.github/workflows/tests.yml` | CI/CD pipeline |
| `data/seed_transactions.csv` | Test data with defects |
| `reports/bug_report.md` | Detailed bug analysis |
| `reports/test_results.md` | Test execution results |

---

*Generated as part of ExpenseGuard development - Full-stack expense tracker with test-first debugging methodology*