# Frontend Test Suites

This folder contains automated frontend coverage for:

- Unit tests (`tests/unit`)
- Integration tests (`tests/integration`)
- End-to-end style flow tests (`tests/e2e`)

## Coverage highlights

- API helper unit checks (auth mapping and token storage)
- Route guard integration behavior (`RequireAuth`)
- Auto-book search flow navigation (search auto mode to results)

## Run

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:all
```
