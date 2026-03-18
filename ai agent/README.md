# Safari Connect AI Agent

Autonomous decision-making service for the Safari Connect hackathon project.

This folder contains only the AI-agent scope (Node.js), not the full platform UI/backend.

## What This AI Agent Does

1. Recommendation decision
- Ranks available trips by price, travel time, and reliability.
- Returns a top pick and full ranked list.

2. Dynamic pricing insight
- Forecasts likely fare movement from departure window demand.
- Suggests cheaper travel windows.

3. Delay risk prediction
- Estimates delay risk level from route, weather, and traffic risk inputs.
- Returns risk score, risk level, and action guidance.

4. Fraud/anomaly scoring
- Scores suspicious booking/payment behavior.
- Returns allow/review/block decision.

5. Chat assistant
- Interprets traveler intent from text prompts.
- Returns concise decision guidance.

6. Voice assistant (English + Swahili)
- Accepts transcript input and returns TTS-ready response text.
- Supports bilingual interaction for local accessibility.

7. Unified decision assist (professional orchestration)
- Combines recommendation, pricing, delay-risk, fraud, and chat into one response.
- Returns decision summary with top action and passenger message.

## Stack

- Runtime: Node.js
- API: Express
- AI provider: Google Gemini (with safe fallback)
- Config: dotenv
- Tests: node:test

## Project Structure

```text
ai agent/
  docs/
    architecture.md
  src/
    app.js
    server.js
    config/
      env.js
    contracts/
      mvp-contract.js
    modules/
      chat/service.js
      voice/service.js
      recommendation/service.js
      pricing/service.js
      prediction/service.js
      fraud/service.js
    shared/
      gemini.js
      language.js
  tests/
    unit/services.test.js
    integration/contract.test.js
  .env
  .env.example
  .gitignore
  package.json
```

## API Endpoints (MVP v1)

- GET /health
- GET /v1/contract
- POST /v1/recommendation/score
- POST /v1/pricing/forecast
- POST /v1/prediction/delay-risk
- POST /v1/fraud/score
- POST /v1/chat/respond
- POST /v1/voice/respond
- POST /v1/decision/assist

## Language Support

- en (English)
- sw (Swahili)

If an unsupported language is provided, the service falls back to default language (en).

## Environment Variables

Copy from .env.example and set values:

- NODE_ENV
- PORT
- GEMINI_API_KEY
- GEMINI_MODEL
- GEMINI_API_BASE_URL
- DEFAULT_LANGUAGE
- SUPPORTED_LANGUAGES
- VOICE_PROVIDER

## Quick Start

```bash
cd "ai agent"
npm install
npm run dev
```

## Run Tests

```bash
npm test
```

## Sample Requests

Recommendation:

```bash
curl -X POST http://localhost:4100/v1/recommendation/score \
  -H "Content-Type: application/json" \
  -d "{\"trips\":[{\"id\":\"A\",\"price\":1400,\"travelMinutes\":420,\"reliabilityScore\":0.8},{\"id\":\"B\",\"price\":1100,\"travelMinutes\":460,\"reliabilityScore\":0.7}],\"intent\":{\"maxBudget\":1500,\"maxTravelMinutes\":500}}"
```

Chat (Gemini wired):

```bash
curl -X POST http://localhost:4100/v1/chat/respond \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"I want to go to Kisii tomorrow morning under 1500\",\"language\":\"en\"}"
```

Voice (Swahili):

```bash
curl -X POST http://localhost:4100/v1/voice/respond \
  -H "Content-Type: application/json" \
  -d "{\"transcript\":\"Nataka kwenda Kisii kesho asubuhi kwa chini ya 1500\",\"language\":\"sw\"}"
```

Unified Decision Assist:

```bash
curl -X POST http://localhost:4100/v1/decision/assist \
  -H "Content-Type: application/json" \
  -d "{\"trips\":[{\"id\":\"A\",\"price\":1400,\"travelMinutes\":420,\"reliabilityScore\":0.8}],\"intent\":{\"maxBudget\":1500,\"maxTravelMinutes\":500},\"route\":\"Nairobi-Kisii\",\"departureTime\":\"2026-03-20T07:30:00.000Z\",\"currentPrice\":1400,\"riskFactors\":{\"weatherRisk\":0.2,\"trafficRisk\":0.6,\"routeRisk\":0.3},\"fraudSignals\":{\"attemptsLast24h\":1,\"cardMismatch\":false,\"rapidRetries\":0,\"geoMismatch\":false},\"prompt\":\"Need the best morning option under 1500\",\"language\":\"en\"}"
```

## Hackathon Scope Note

This AI folder is designed as a contract-first decision service that integrates with:
- Passenger flow (trip suggestions, risk hints)
- SACCO owner flow (pricing and demand insights)
- Admin flow (fraud/anomaly signals)

The rest of the product (full booking UI and operational dashboards) remains outside this folder.
