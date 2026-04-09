# Layer 2 - Competitor Discovery Layer

## Purpose

Find plausible alternative suppliers for a selected ingredient via web search. Returns a ranked list of candidate suppliers with evidence hints indicating the likelihood of available technical documentation.

## Status: Implemented

Located at `src/competitor_layer/competitor_layer/`.

## Architecture

```
Input JSON
  |
  v
load_config()             -- environment + .env config
  |
  v
plan_queries()            -- deterministic query generation
  |                         (+ optional Gemini synonym expansion)
  v
collect_sources()         -- execute queries via search adapter
  |                         (Google CSE / DuckDuckGo / Mock)
  v
extract_candidates()      -- group by domain, extract supplier info
  |                         (name, type, country, evidence hints)
  v
filter_and_rank()         -- score, filter, rank candidates
  |
  v
Output JSON
```

## Input Contract

```json
{
  "schema_version": "1.0",
  "trace_id": "optional-trace-id",
  "ingredient": {
    "ingredient_id": "ING-001",
    "canonical_name": "Ascorbic Acid",
    "aliases": ["Vitamin C", "L-Ascorbic Acid"],
    "category": "food ingredient"
  },
  "context": {
    "region": "US",
    "product_category": "beverage",
    "grade_hint": "food grade"
  },
  "requirements_context": {
    "required_grade": "USP",
    "notes": "optional notes"
  },
  "runtime": {
    "max_candidates": 10,
    "ranking_enabled": true
  }
}
```

## Output Contract

```json
{
  "schema_version": "1.0",
  "trace_id": "abc12345",
  "ingredient_id": "ING-001",
  "search_summary": {
    "queries_used": ["Ascorbic Acid supplier", "..."],
    "region_applied": "US",
    "ranking_enabled": true,
    "gemini_enabled": true
  },
  "candidates": [
    {
      "supplier": {
        "supplier_id": "SUP-001",
        "supplier_name": "DSM-Firmenich",
        "supplier_type": "manufacturer",
        "country": "NL",
        "website": "https://www.dsm-firmenich.com"
      },
      "matched_offers": [
        {
          "offer_label": "Ascorbic Acid Food Grade",
          "matched_name": "Ascorbic Acid",
          "source_url": "https://..."
        }
      ],
      "evidence_hints": {
        "website_found": true,
        "product_page_found": true,
        "pdf_found": true,
        "technical_doc_likely": true
      },
      "candidate_confidence": "high",
      "rank": 1,
      "reason": "Major manufacturer..."
    }
  ],
  "warnings": [],
  "stats": {
    "raw_results_seen": 42,
    "deduped_suppliers": 8,
    "returned_candidates": 5
  }
}
```

## Components

### Config (`config.py`)

`CompetitorConfig` dataclass loaded from environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | - | Google AI Studio key (optional) |
| `GEMINI_MODEL` | `gemini-2.5-pro` | Gemini model for ranking/reasoning |
| `COMPETITOR_MAX_CANDIDATES` | `10` | Max candidates to return |
| `COMPETITOR_RANKING_ENABLED` | `true` | Enable scoring and ranking |
| `GOOGLE_API_KEY` | - | Google Custom Search API key |
| `GOOGLE_CSE_ID` | - | Google Custom Search Engine ID |
| `COMPETITOR_SEARCH_ENGINE` | `auto` | `auto`, `google`, `duckduckgo`, `mock` |
| `COMPETITOR_SEARCH_RESULTS_PER_QUERY` | `10` | Results per query |
| `COMPETITOR_SEARCH_DELAY` | `1.0` | Delay between queries (seconds) |

### Query Planner (`query_planner.py`)

**Deterministic queries** (always generated):
- `{name} supplier`
- `{name} manufacturer`
- `{name} distributor`
- `{name} {grade} supplier`
- `{name} technical data sheet`
- `{name} product page`
- Alias queries (2 per alias, up to 2 aliases)
- Region-qualified queries if region provided
- Product category query if category provided

**Gemini-enhanced queries** (when Gemini client available):
- Synonym expansion via `SynonymExpansion` structured output
- Additional industry search queries
- Extra supplier queries from discovered synonyms
- Cap: 20 queries max

### Search Adapter (`search_adapter.py`)

Pluggable search backends via `SearchAdapter` ABC:

| Adapter | When used | API key required |
|---|---|---|
| `GoogleSearchAdapter` | `engine=google` or `auto` with keys | `GOOGLE_API_KEY` + `GOOGLE_CSE_ID` |
| `DuckDuckGoAdapter` | `engine=duckduckgo` or `auto` fallback | No (uses `ddgs` library) |
| `MockSearchAdapter` | `engine=mock` or `auto` final fallback | No |

Region normalization for both Google (`gl` parameter) and DuckDuckGo region formats.

### Source Collector (`source_collector.py`)

- Executes all planned queries sequentially through the search adapter
- Applies rate limiting delay between queries (`search_delay`)
- Deduplicates results by URL (keeps first occurrence)
- Returns `SearchResultSet` with total counts and any errors

### Candidate Extractor (`candidate_extractor.py`)

Six-stage pipeline:

**Stage 1 - Domain grouping and filtering:**
- Groups search results by domain
- Rejects non-supplier domains (Wikipedia, Amazon, Reddit, YouTube, .gov, .edu, social media, news sites, etc.)
- 30+ rejected domains in `REJECTED_DOMAINS`

**Stage 2 - Supplier name extraction:**
- Strategy A: Extract from title separators (` - `, ` | `, etc.) — takes the segment that doesn't contain the ingredient name
- Strategy B: Domain-to-name conversion (strip TLD, replace hyphens, title case)

**Stage 3 - Supplier type classification:**
- Keyword scoring against `TYPE_SIGNALS` (manufacturer/distributor/reseller)
- Each keyword has a weight (1-3); requires minimum score of 2
- Tiebreaker: prefer `manufacturer`
- Optional: Gemini classification for `unknown` cases via `SupplierClassification` structured output

**Stage 4 - Country inference:**
- Source A: Country-code TLD lookup (`.de` -> `DE`, `.co.uk` -> `GB`, etc.)
- Source B: Snippet keyword matching (`"germany"` -> `DE`, `"china"` -> `CN`, etc.)

**Stage 5 - Evidence hint detection:**
- Product page: URL path contains `/product`, `/ingredient`, `/catalog`, etc.
- PDF: URL ends with `.pdf`
- Technical docs: title/snippet contains "technical data sheet", "tds", "coa", "specification sheet", etc.

**Stage 6 - Merge and confidence:**
- Deduplicates by normalized company name (strips suffixes like Inc, Ltd, GmbH)
- Merges offers, evidence hints, and metadata
- Assigns confidence based on: has type + has evidence + multiple results = `high`

### Candidate Filter (`candidate_filter.py`)

**Scoring formula** (weighted sum, 0.0 - 1.0):
```
score = 0.40 * ingredient_match
      + 0.25 * context_match
      + 0.20 * evidence_strength
      + 0.15 * source_quality
```

| Component | How scored |
|---|---|
| `ingredient_match` | 1.0 exact in label, 0.7 alias in label, 0.3 in URL |
| `context_match` | 1.0 grade hint match, 0.5 category match |
| `evidence_strength` | 0.25 per flag (website, product page, PDF, tech doc) |
| `source_quality` | manufacturer=1.0, distributor=0.7, reseller=0.4, unknown=0.2 |

**Confidence thresholds:**
- `high`: score >= 0.6
- `medium`: score >= 0.35
- `low`: score < 0.35

**Minimum threshold:** 0.15 (candidates below this are removed)

Optional: Gemini-generated reasoning per candidate via `SupplierReasoning` structured output.

### Gemini Client (`gemini_client.py`)

- Wrapper around `google-genai` SDK with structured output (JSON mode + Pydantic validation)
- Primary model + fallback model pattern (default fallback: `gemini-2.5-flash`)
- Returns `None` on any failure (graceful degradation)

**Response schemas:**
- `SynonymExpansion`: `additional_names[]`, `industry_queries[]`
- `SupplierReasoning`: `reason`
- `SupplierClassification`: `supplier_type`, `confidence`, `explanation`

### Runner (`runner.py`)

Two modes:
- **Search mode** (`_search_run`): Full pipeline with live search
- **Mock mode** (`_mock_run`): Hardcoded candidates for testing/demos

Mock mode produces 5 realistic candidates: DSM-Firmenich (NL, manufacturer), CSPC Pharma (CN, manufacturer), Prinova USA (US, distributor), Northeast Pharma (CN, manufacturer), PureBulk (US, reseller).

### Pydantic Schemas (`schemas.py`)

**Enums:**
- `SupplierType`: `manufacturer`, `distributor`, `reseller`, `unknown`
- `CandidateConfidence`: `high`, `medium`, `low`

**Input:** `CompetitorInput` with `IngredientRef`, `SearchContext`, `RequirementsContext`, `RuntimeConfig`

**Output:** `CompetitorOutput` with `SearchSummary`, `Candidate[]`, `OutputStats`, warnings

## CLI Usage

```bash
# Via CLI
python -m competitor_layer.cli --input examples/input_ascorbic_acid.json

# Programmatic
from competitor_layer.runner import run_from_json
result = run_from_json('{"ingredient": {...}}')
```

## Test Suite

10 test modules in `src/competitor_layer/tests/`:

| Test | What it covers |
|---|---|
| `test_mock_runner.py` | Mock pipeline end-to-end |
| `test_search_adapter.py` | All adapter implementations |
| `test_source_collector.py` | Query execution and dedup |
| `test_query_planner.py` | Query generation logic |
| `test_candidate_extractor.py` | All 6 extraction stages |
| `test_candidate_filter.py` | Scoring and ranking |
| `test_contract.py` | Schema validation |
| `test_gemini_client.py` | Structured output |
| `test_schemas.py` | Pydantic models |
| `test_integration.py` | Full pipeline integration |

## Responsibility Boundaries

**Responsible for:**
- Supplier search across multiple engines
- Deduplication and normalization
- Candidate generation with evidence hints
- Lightweight type classification

**Not responsible for:**
- Full TDS/COA retrieval or parsing
- Document extraction
- Requirement verification
- Final recommendation
