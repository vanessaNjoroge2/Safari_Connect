
# AI Agent Architecture (Node.js MVP)

## Goal
Build an autonomous decision-making AI agent for hackathon speed, focused only on:
- recommendation ranking
- dynamic pricing insight
- delay risk prediction
- fraud/anomaly scoring
- operations dispatch planning
- chat + voice assistant (English and Swahili)

## Current Folder Structure

```text
/root-project
  /ai agent
    /docs
      architecture.md
    /src
      app.js
      server.js
      /config
        env.js
      /contracts
        mvp-contract.js
      /modules
        /chat
          service.js
        /voice
          service.js
        /recommendation
          service.js
        /pricing
          service.js
        /prediction
          service.js
        /fraud
          service.js
      /shared
        language.js
    /tests
      /unit
        services.test.js
      /integration
        contract.test.js
    .env
    .env.example
    .gitignore
    package.json
    README.md
```

## MVP API Contract (v1)

### 1) Recommendation Decision
- Endpoint: `POST /v1/recommendation/score`
- Input: `trips[]`, `intent.maxBudget`, `intent.maxTravelMinutes`
- Output: `topPick`, `ranked[]`, `rationale`

### 2) Pricing Decision
- Endpoint: `POST /v1/pricing/forecast`
- Input: `route`, `departureTime`, `currentPrice`
- Output: `predictedPrice`, `demandLevel`, `cheaperWindowSuggestion`

### 3) Delay Risk Decision
- Endpoint: `POST /v1/prediction/delay-risk`
- Input: `weatherRisk`, `trafficRisk`, `routeRisk`
- Output: `riskScore`, `riskLevel`, `recommendation`

### 4) Fraud Decision
- Endpoint: `POST /v1/fraud/score`
- Input: `attemptsLast24h`, `cardMismatch`, `rapidRetries`, `geoMismatch`
- Output: `fraudScore`, `decision`, `reason`

### 5) Chat Assistant
- Endpoint: `POST /v1/chat/respond`
- Input: `text`, `language`
- Output: `intent`, `message`, `source`, `modelUsed`

### 6) Operations Dispatch Planner
- Endpoint: `POST /v1/operations/dispatch-plan`
- Input: `route`, `departureTime`, `totalSeats`, `bookedSeats`, `noShowRate`, `weatherRisk`, `trafficRisk`
- Output: `demandLevel`, `occupancyRate`, `riskLevel`, `combinedRisk`, `overbookingBuffer`, `action`, `dispatchAdvice`

### 7) Voice Assistant (Bilingual)
- Endpoint: `POST /v1/voice/respond`
- Input: `transcript`, `language`
- Output: `replyText`, `ttsVoice`, `source`, `modelUsed`, `inputMode`, `outputMode`, `note`

Supported languages:
- `en` (English)
- `sw` (Swahili)

## Why Voice Is Included
Yes, voice is needed for this hackathon use case.
- Transport booking users often prefer speaking route and budget quickly.
- Swahili + English supports local accessibility and better adoption.
- Voice enables hands-free interaction and faster booking intent capture.

## Runtime Notes
- Language normalization: defaults to `en` if unsupported language is provided.
- Voice provider is configurable via environment variables.
- Gemini generation uses `GEMINI_API_KEY` and `GEMINI_MODEL`; if Gemini fails, endpoints return deterministic fallback text.
- Contract endpoint available at `GET /v1/contract` for frontend/backend alignment.

## Fast Start
```bash
cd "ai agent"
npm install
npm run dev
```

