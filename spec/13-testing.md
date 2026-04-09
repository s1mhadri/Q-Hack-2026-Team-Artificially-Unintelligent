# Testing

## Test Framework

- **Python:** pytest >= 9.0.3, pytest-asyncio >= 1.3.0, pytest-cov >= 7.1.0
- **JavaScript:** ESLint (no test runner configured for frontend)

## Running Tests

```bash
# All root-level tests
pytest tests/ -v

# Competitor layer tests
pytest src/competitor_layer/tests/ -v

# With coverage
pytest src/competitor_layer/tests/ -v --cov=competitor_layer

# Lint frontend
npm run lint
```

## Test Configuration

```toml
# pyproject.toml
[tool.pytest.ini_options]
pythonpath = ["."]
```

## Layer 2 Test Suite

Located at `src/competitor_layer/tests/`, 10 modules:

### `test_mock_runner.py`
- Mock pipeline produces valid output
- Correct number of candidates
- Output conforms to `CompetitorOutput` schema
- Warnings generated for missing region

### `test_search_adapter.py`
- `MockSearchAdapter` returns results
- `GoogleSearchAdapter` constructs correct API params
- `DuckDuckGoAdapter` normalizes regions
- `create_search_adapter()` selects correct adapter based on config

### `test_source_collector.py`
- Deduplication by URL works correctly
- Errors are captured without crashing
- Rate limit delay applied between queries
- `SearchResultSet` contains expected fields

### `test_query_planner.py`
- Deterministic queries include all families
- Alias queries generated correctly
- Region queries added when context provided
- No duplicate queries
- Max query limit respected

### `test_candidate_extractor.py`
- Domain extraction from various URL formats
- Rejected domain filtering
- Supplier name extraction from titles
- Supplier type classification from keywords
- Country inference from TLDs and snippets
- Evidence hint detection (product pages, PDFs, tech docs)
- Duplicate merging logic

### `test_candidate_filter.py`
- Scoring formula produces expected values
- Confidence thresholds applied correctly
- Minimum score threshold filters low-quality candidates
- Ranking order correct (score descending)
- Warnings generated for low-evidence candidates

### `test_contract.py`
- Input schema validation
- Output schema validation
- Round-trip serialization/deserialization
- Required vs optional fields

### `test_gemini_client.py`
- Client creation with/without API key
- Structured output parsing
- Fallback model behavior
- Error handling (returns None on failure)

### `test_schemas.py`
- All Pydantic model validation
- Enum constraints
- Default values
- Serialization modes

### `test_integration.py`
- Full pipeline with mock adapter
- End-to-end: input -> output with all fields populated
- Config overrides respected

## Mock Data

### Root test fixtures (`tests/mock_data_layer1/`)

| File | Ingredient | Purpose |
|---|---|---|
| `mock_ascorbic_acid.json` | Ascorbic Acid | Complex fixture (10-15 rules, multiple rule types) |
| `mock_citric_acid.json` | Citric Acid | Basic fixture (5-8 rules) |
| `mock_natural_vanilla_flavor.json` | Natural Vanilla Flavor | Minimal numerical specs |

### Layer 1 mock data (`src/requirement_layer/mock_data/`)

Same three fixtures, duplicated for standalone layer testing.

### Layer 2 examples (`src/competitor_layer/examples/`)

| File | Purpose |
|---|---|
| `input_ascorbic_acid.json` | Sample input for competitor discovery |
| `output_mock.json` | Expected mock output for validation |

## Testing Gaps

- **No frontend tests**: No Jest, Vitest, or React Testing Library configured
- **No Layer 1 unit tests**: The requirement layer has mock data but no test files
- **No API endpoint tests**: No test coverage for `api/index.py`
- **No supplier research tests**: `src/supplier_research/` has no test directory
- **Layer 3 & 4**: Not implemented, spec includes planned test cases
