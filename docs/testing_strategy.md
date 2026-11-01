# Testing Strategy

## Overview

ExpenseGuard employs a comprehensive testing strategy covering unit, integration, frontend, property-based, and end-to-end tests. The goal is to achieve 80%+ code coverage while ensuring financial correctness and reliability.

## Test Pyramid

```
                    /\
                   /  \     E2E Tests (Playwright)
                  /____\    - Critical user journeys
                 /      \   - 10-15 tests
                /--------\
               /          \  Frontend Tests (React Testing Library)
              /            \ - Component rendering
             /--------------\ - User interactions
            /                \ - Form validation
           /------------------\ - 20-30 tests
          /                    \
         /      Integration     \  Integration Tests (Supertest)
        /       Tests            \ - API endpoints
       /--------------------------\ - Database operations
      /                            \ - 20-30 tests
     /                              \
    /        Unit Tests             \  Unit Tests (Jest)
   /  (Services, Utils, Repos)       \ - Pure functions
  /------------------------------------\ - Business logic
 /                                      \ - 30-40 tests
/                                        \
---------------------------------------------
```

## Test Categories

### 1. Unit Tests (Backend)

**Location**: `backend/tests/*.test.ts`

**Coverage Target**: 80%+

**Focus Areas**:
- Currency calculations (decimal.js)
- Transaction validation
- Category management
- Monthly summaries
- Date boundary handling
- Budget calculations and alerts
- Recurring expense scheduling
- Duplicate detection
- CSV parsing

**Tools**: Jest, ts-jest

**Example**:
```typescript
test('should calculate monthly totals correctly', () => {
  const income = new Decimal('5000');
  const expense = new Decimal('1200.50');
  const balance = income.minus(expense);
  expect(balance.toFixed(2)).toBe('3799.50');
});
```

### 2. Integration Tests (Backend)

**Location**: `backend/tests/*.test.ts`

**Coverage Target**: 80%+

**Focus Areas**:
- Transaction API (CRUD, filtering, pagination)
- Database persistence
- Budget API
- Category API
- CSV import/export
- Monthly summary API
- Recurring expense execution

**Tools**: Jest, Supertest, Test database

**Database Strategy**:
- Separate test database (`expenseguard_test`)
- Clean up before/after each test suite
- Use transactions for isolation where possible

### 3. Frontend Tests

**Location**: `frontend/src/tests/*.test.tsx`

**Coverage Target**: 80%+

**Focus Areas**:
- Dashboard rendering
- Transaction forms and validation
- Filtering and sorting
- Budget warnings display
- Loading and error states
- CSV upload interactions
- Chart rendering

**Tools**: Jest, React Testing Library, @testing-library/jest-dom

**Example**:
```typescript
test('renders transaction form with validation', () => {
  render(<TransactionForm />);
  fireEvent.click(screen.getByText('Create'));
  expect(screen.getByText('Title is required')).toBeInTheDocument();
});
```

### 4. Property-Based Tests

**Location**: `backend/tests/property.test.ts`, `frontend/src/tests/property.test.ts`

**Coverage Target**: Key invariants

**Focus Areas**:
- Adding income increases total income
- Adding expense increases total expenses
- Deleting transaction reverses its contribution
- Monthly totals equal sum of included transactions
- Currency calculations preserve precision
- CSV serialization/parsing preserves valid data

**Tools**: fast-check

**Example**:
```typescript
test('adding income increases total income', () => {
  fc.assert(fc.property(fc.float({min: 0.01, max: 10000}), (amount) => {
    const initialIncome = getTotalIncome();
    addTransaction({ type: 'INCOME', amount });
    expect(getTotalIncome()).toBe(initialIncome + amount);
  }));
});
```

### 5. End-to-End Tests

**Location**: `frontend/tests/e2e/*.spec.ts`

**Coverage Target**: Critical user journeys

**Focus Areas**:
- Opening the application
- Creating a transaction
- Editing a transaction
- Deleting a transaction
- Creating a budget
- Importing a CSV
- Exporting a CSV
- Viewing monthly summaries

**Tools**: Playwright

**Test Environment**:
- Separate test database
- Backend server running
- Frontend built and served
- Chromium browser

## Test Database

### Setup
```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Run migrations
npx prisma migrate deploy --schema=backend/prisma/schema.prisma

# Seed test data
npx tsx backend/prisma/seed.test.ts
```

### Teardown
```bash
docker-compose -f docker-compose.test.yml down -v
```

## Continuous Integration

### GitHub Actions Workflow
- Runs on push and PR to main/develop
- Parallel job execution
- Coverage reporting
- Failure on threshold breach

### Pipeline Stages
1. **Lint** - ESLint for both frontend and backend
2. **Backend Tests** - Unit + Integration with test database
3. **Frontend Tests** - Unit + Component tests
4. **E2E Tests** - Full stack with Playwright
5. **Coverage Report** - Aggregate and verify thresholds

## Coverage Thresholds

| Metric | Threshold |
|--------|-----------|
| Statements | 80% |
| Branches | 80% |
| Functions | 80% |
| Lines | 80% |

## Running Tests Locally

```bash
# All tests
npm test

# Backend only
npm run test:backend

# Frontend only
npm run test:frontend

# Watch mode
npm run test:watch

# E2E tests
npm run e2e

# Coverage report
npm test -- --coverage
```

## Test Data Management

### Fixtures
- Reusable test data in `backend/tests/fixtures/`
- Factory functions for creating test entities
- Consistent IDs for predictable tests

### Factories
```typescript
export const createTestTransaction = (overrides = {}) => ({
  title: 'Test Transaction',
  amount: new Decimal('100.00'),
  type: 'EXPENSE' as const,
  categoryId: testCategoryId,
  date: new Date('2024-01-15'),
  ...overrides,
});
```

## Debugging Tests

### VS Code Debug Configuration
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Backend Tests",
  "program": "${workspaceFolder}/backend/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-coverage"],
  "console": "integratedTerminal"
}
```

### Logging
- Set `DEBUG=*` for verbose output
- Use `console.log` in tests (cleaned up in CI)
- Structured logging in test helpers

## Best Practices

### Do's
- Test behavior, not implementation
- Use descriptive test names
- One assertion per test when possible
- Clean up test data
- Use factories for test data
- Test edge cases and boundaries
- Mock external dependencies

### Don'ts
- Don't test implementation details
- Don't rely on test order
- Don't share state between tests
- Don't use production database
- Don't skip tests without reason
- Don't mock what you don't own

## Bug Regression Tests

For each seeded bug (BUG-01 through BUG-05):
1. Write failing test that reproduces the bug
2. Document in `reports/bug_report.md`
3. Fix the bug
4. Verify test passes
5. Add to regression suite

## Performance Testing

### Load Testing (Future)
- Artillery or k6 for API load testing
- Target: 1000 req/s for read endpoints
- Target: 100 req/s for write endpoints

### Database Performance
- Query analysis with `EXPLAIN ANALYZE`
- Index optimization for common queries
- Connection pool tuning

## Test Reporting

### Coverage Reports
- HTML: `reports/coverage/backend/index.html`
- HTML: `reports/coverage/frontend/index.html`
- LCOV: `reports/coverage/lcov.info`

### Test Results
- JUnit XML for CI integration
- Summary in `reports/test_results.md`
- Debugging log in `reports/debugging_log.md`