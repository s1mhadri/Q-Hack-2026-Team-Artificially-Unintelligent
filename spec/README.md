# Agnes Repository Specification

Complete technical specification of the Agnes AI Supply Chain Manager repository.

## Documents

| # | Document | Description |
|---|---|---|
| 00 | [Overview](00-overview.md) | Project identity, architecture summary, tech stack, design principles |
| 01 | [Directory Structure](01-directory-structure.md) | Full file tree with annotations |
| 02 | [Shared Contracts](02-shared-contracts.md) | Cross-layer data objects (IngredientRef, SupplierRef, RequirementRule, EvidenceItem, ExtractedAttribute, VerificationResult) |
| 03 | [Layer 1 - Requirements](03-layer1-requirements.md) | Requirements Layer: Gemini agent, input processing, rule validation, ID generation |
| 04 | [Layer 2 - Competitor Discovery](04-layer2-competitor-discovery.md) | Competitor Discovery: search adapters, query planning, candidate extraction, scoring/ranking |
| 05 | [Layer 3 - Quality Verification](05-layer3-quality-verification.md) | Quality Verification Layer: evidence retrieval, extraction, normalization, verification (spec) |
| 06 | [Layer 4 - Recommendation](06-layer4-recommendation.md) | Recommendation Layer: decision logic, explanation generation (spec) |
| 07 | [Supplier Research Agent](07-supplier-research-agent.md) | LangGraph two-agent pipeline: DB lookup, Gemini research, URL fetching, field extraction, verification |
| 08 | [Frontend](08-frontend.md) | Next.js workspace UI: layout, tab navigation, API integration |
| 09 | [Backend API](09-backend-api.md) | FastAPI endpoints: health, layer1-4 runners/simulators |
| 10 | [Database](10-database.md) | SQLite schema, tables, query patterns, pre-computed requirements |
| 11 | [Configuration & Deployment](11-configuration-deployment.md) | Environment variables, pyproject.toml, package.json, Vercel, dev workflow |
| 12 | [Data Flow](12-data-flow.md) | End-to-end pipeline, layer-to-layer dependencies, integration conventions |
| 13 | [Testing](13-testing.md) | Test framework, test suite inventory, mock data, testing gaps |
| 14 | [LLM Integration](14-llm-integration.md) | Models, SDK patterns, prompts, rate limiting, error handling |

## Quick Reference

**Run the app:**
```bash
npm run dev          # frontend (3000) + API (8000)
```

**Run the supplier research agent:**
```bash
python -m src.supplier_research.main "ascorbic acid" --json
```

**Run Layer 1 standalone:**
```bash
uv run src/requirement_layer/runner.py --input src/requirement_layer/mock_data/mock_ascorbic_acid.json
```

**Run tests:**
```bash
pytest src/competitor_layer/tests/ -v
```
