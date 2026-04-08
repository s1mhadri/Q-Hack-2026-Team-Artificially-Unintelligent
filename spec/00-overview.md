# Agnes - Complete Repository Specification

## Project Identity

| Field | Value |
|---|---|
| **Name** | Agnes |
| **Tagline** | AI Supply Chain Manager for CPG Ingredient Consolidation |
| **Team** | Team Artificially-Unintelligent |
| **Event** | Q-Hack 2026 |
| **Repository** | `Q-Hack-2026-Team-Artificially-Unintelligent` |
| **Python project name** | `spherecast` |
| **Version** | 0.1.0 (PoC) |

## What Agnes Does

Agnes is a decision-support system that helps CPG (Consumer Packaged Goods) companies consolidate their ingredient supply chains. Given an ingredient, Agnes:

1. **Defines what a valid substitute must satisfy** (quality requirements, regulatory compliance)
2. **Finds alternative suppliers** across the market via web search and database lookup
3. **Verifies supplier quality** by retrieving and analyzing technical evidence (TDS, COA)
4. **Produces an explainable recommendation** with evidence trails and confidence scores

The system is designed as a modular pipeline where each layer can be developed, tested, and deployed independently.

## Architecture Summary

```
Layer 0 (optional)     Layer 1           Layer 2             Layer 3              Layer 4
Consolidation      --> Requirements  --> Competitor       --> Quality           --> Recommendation
Opportunity           Layer             Discovery            Verification         Layer
Ranking                                 Layer                Layer

"Where should        "What must        "Who are the       "Do they meet       "What should
 we look?"            be true?"         alternatives?"     the requirements?"   we recommend?"
```

## Technology Stack

| Component | Technology | Version |
|---|---|---|
| Frontend | Next.js + React | 16.2.3 / 19.2.4 |
| Backend API | FastAPI + Uvicorn | latest |
| Language (backend) | Python | >= 3.12 |
| Language (frontend) | TypeScript | ^5 |
| LLM (primary) | Google Gemini | gemini-2.5-pro / gemini-3-flash-preview |
| LLM framework | google-genai SDK | >= 1.70.0 |
| Agent framework | LangGraph + LangChain | latest |
| Data validation | Pydantic | >= 2.12.5 |
| Database | SQLite | embedded |
| Search | Google CSE, DuckDuckGo, Mock | pluggable |
| Deployment | Vercel | serverless |
| Package manager (Python) | uv | latest |
| Package manager (JS) | npm | latest |

## Implementation Status

| Layer | Status | Notes |
|---|---|---|
| Layer 0 - Consolidation Ranking | Spec only | Optional; not implemented |
| Layer 1 - Requirements | **Implemented** | Gemini + Google Search Grounding |
| Layer 2 - Competitor Discovery | **Implemented** | Multi-engine search + Gemini ranking |
| Layer 3 - Quality Verification | **Spec complete** | API endpoint returns simulated data |
| Layer 4 - Recommendation | **Spec complete** | API endpoint returns simulated data |
| Supplier Research Agent | **Implemented** | LangGraph two-agent pipeline (separate from Layers) |
| Frontend | **Implemented** | Next.js workspace UI |
| Backend API | **Implemented** | FastAPI with all 4 layer endpoints |

## Design Principles

1. **Modular ownership** - Each layer is independently testable with clear contracts
2. **Loose coupling** - Layers depend only on published interface contracts, not internals
3. **Internal freedom, external consistency** - Each layer can choose its own models, prompting strategy, and storage, but must expose the agreed schema
4. **Graceful degradation** - Pipeline works if Layer 0 is skipped, evidence is incomplete, or a supplier has partial data
5. **Traceability** - Every decision is traceable back to the input ingredient, supplier candidate, extracted evidence, and requirement checked
6. **Explicit confidence** - Every extraction or recommendation exposes confidence (high/medium/low)
7. **Stable IDs** - Ingredient, supplier, requirement, and evidence IDs are deterministic and stable across runs
8. **Schema versioning** - Every payload includes `schema_version: "1.0"`
