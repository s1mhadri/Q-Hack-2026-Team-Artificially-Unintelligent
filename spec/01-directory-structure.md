# Directory Structure

## Full Tree

```
.
├── AGENTS.md                              # Build instructions (Next.js docs warning)
├── CLAUDE.md                              # References AGENTS.md
├── README.md                              # Project readme
├── spec.md                                # Master modular architecture spec
├── agnes_competitor_layer_spec.md         # Detailed Layer 2 specification
├── agnes_modular_spec.md                  # Early modular design overview
├── agnes_poc_short.md                     # Short PoC summary
├── quality_verification_layer_spec.md     # Layer 3 specification
│
├── api/
│   └── index.py                           # FastAPI backend (all endpoints)
│
├── src/
│   ├── app/                               # Next.js frontend
│   │   ├── layout.tsx                     # Root layout with sidebar navigation
│   │   ├── page.tsx                       # Main workspace page (4-layer UI)
│   │   ├── page.module.css                # Page-level styles
│   │   ├── globals.css                    # Global CSS (dark theme)
│   │   └── favicon.ico
│   │
│   ├── requirement_layer/                 # Layer 1 - Requirements
│   │   ├── runner.py                      # CLI entry point + pipeline orchestration
│   │   ├── requirement_engine.py          # Gemini LLM agent with Search Grounding
│   │   ├── input_processor.py             # Input validation & unit normalization
│   │   ├── output_formatter.py            # JSON serialization
│   │   ├── rule_validator.py              # Rule logic validation
│   │   ├── id_generator.py                # Stable REQ-{INGREDIENT}-{SEQ} IDs
│   │   ├── prompts.py                     # System prompt for Gemini
│   │   ├── model_config.py                # Model constants and tool config
│   │   ├── schemas/
│   │   │   └── models.py                  # Pydantic models (all I/O contracts)
│   │   └── mock_data/
│   │       ├── mock_ascorbic_acid.json    # Complex test fixture (10-15 rules)
│   │       ├── mock_citric_acid.json      # Basic test fixture (5-8 rules)
│   │       └── mock_natural_vanilla_flavor.json  # Minimal numerical specs
│   │
│   ├── competitor_layer/                  # Layer 2 - Competitor Discovery
│   │   ├── competitor_layer/              # Inner package
│   │   │   ├── __init__.py
│   │   │   ├── runner.py                  # Pipeline orchestration + mock mode
│   │   │   ├── cli.py                     # CLI entry point
│   │   │   ├── config.py                  # Environment configuration loader
│   │   │   ├── schemas.py                 # Pydantic I/O contracts
│   │   │   ├── models.py                  # Internal domain types
│   │   │   ├── search_types.py            # Search result types
│   │   │   ├── search_adapter.py          # Pluggable search backends
│   │   │   ├── source_collector.py        # Query execution + deduplication
│   │   │   ├── query_planner.py           # Query generation + Gemini expansion
│   │   │   ├── candidate_extractor.py     # Supplier extraction + normalization
│   │   │   ├── candidate_filter.py        # Scoring, ranking, filtering
│   │   │   ├── gemini_client.py           # Gemini structured output wrapper
│   │   │   └── prompts.py                 # Prompt templates
│   │   ├── tests/                         # Comprehensive test suite
│   │   │   ├── test_mock_runner.py
│   │   │   ├── test_search_adapter.py
│   │   │   ├── test_source_collector.py
│   │   │   ├── test_query_planner.py
│   │   │   ├── test_candidate_extractor.py
│   │   │   ├── test_candidate_filter.py
│   │   │   ├── test_contract.py
│   │   │   ├── test_gemini_client.py
│   │   │   ├── test_schemas.py
│   │   │   └── test_integration.py
│   │   ├── examples/
│   │   │   ├── input_ascorbic_acid.json   # Sample input
│   │   │   └── output_mock.json           # Sample mock output
│   │   ├── .env.example                   # Environment template
│   │   ├── pyproject.toml                 # Layer-local Python config
│   │   └── README.md
│   │
│   └── supplier_research/                 # LangGraph agent system
│       ├── __init__.py
│       ├── main.py                        # CLI entry point
│       ├── graph.py                       # LangGraph workflow (2-agent pipeline)
│       ├── models.py                      # Pydantic models (QualityProperties, etc.)
│       ├── db.py                          # SQLite supplier queries
│       └── verify.py                      # Evidence fetching, extraction, verification
│
├── data/
│   ├── db.sqlite                          # Challenge database (companies, BOMs, suppliers)
│   └── requirements/                      # Pre-computed requirement specifications
│       ├── calcium-citrate.json
│       ├── vitamin-c.json
│       └── vitamin-d3.json
│
├── Challenge_info/                        # Q-Hack challenge specifications
│   ├── Challenge.md
│   ├── database_info.md
│   └── image.png
│
├── notebooks/                             # Jupyter analysis notebooks
│
├── workflows/                             # n8n workflow configs
│   └── supplier_gemini_research.json      # 6-node supplier research workflow
│
├── tests/                                 # Root-level test fixtures
│   └── mock_data_layer1/
│       ├── mock_ascorbic_acid.json
│       ├── mock_citric_acid.json
│       └── mock_natural_vanilla_flavor.json
│
├── public/                                # Static assets
│
├── package.json                           # Node.js project config
├── package-lock.json
├── pyproject.toml                         # Python project config (spherecast)
├── uv.lock                                # uv lock file
├── requirements.txt                       # pip requirements
├── tsconfig.json                          # TypeScript config
├── next.config.ts                         # Next.js config (API proxy)
├── vercel.json                            # Vercel deployment config
├── eslint.config.mjs                      # ESLint config
├── .env.example                           # Root env template
└── .gitignore
```

## Key Observations

- **Nested package in Layer 2**: `src/competitor_layer/competitor_layer/` has a double nesting structure, where the outer directory contains tests, examples, and config, while the inner directory is the importable Python package.
- **Two parallel implementation approaches**: The `src/supplier_research/` module is a separate LangGraph-based agent system that overlaps with Layers 2-3, implementing a different approach (DB-first lookup + sequential Gemini research + verification).
- **Layer 1 uses flat imports**: `requirement_engine.py` imports from sibling modules directly (`from id_generator import ...`), relying on `sys.path.insert` in `runner.py`.
- **Pre-computed requirements**: `data/requirements/` contains JSON files that the supplier research agent uses for verification, separate from the Layer 1 pipeline.
