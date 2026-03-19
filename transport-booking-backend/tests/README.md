# Backend Test Suites

This folder contains automated coverage for:

- Unit tests (`tests/unit`)
- Integration tests (`tests/integration`)
- End-to-end tests (`tests/e2e`)

## Coverage highlights

- Demo/mock data integrity checks
- Auth login integration
- Trip search integration (bus + matatu)
- Booking and payment-status integration
- Full booking e2e flow (login -> search -> seats -> booking -> retrieval)
- AI analysis field presence checks on key records

## Run

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:all
```

Before running tests, ensure seeded data exists:

```bash
npm run prisma:seed
```
