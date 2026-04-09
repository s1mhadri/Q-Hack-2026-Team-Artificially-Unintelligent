# Supplier Research Agent (LangGraph System)

## Purpose

A separate, end-to-end agent system that combines supplier discovery and quality verification into a single LangGraph workflow. This is a parallel implementation approach to Layers 2-4, using database-first lookup + sequential Gemini research + automated verification.

## Status: Implemented

Located at `src/supplier_research/`.

## Architecture

Two-agent pipeline implemented as a LangGraph `StateGraph`:

```
                  Agent 1: Research
                  ==================
START --> query_db --> research_supplier (loop) --> start_verification
                                                         |
                  Agent 2: Verification                  v
                  =========================
          verify_supplier (loop) --> END
```

### Agent 1 Flow
1. **query_db**: Look up known suppliers from SQLite database
2. **research_supplier**: For each supplier, run a Gemini ReAct agent with Tavily web search to find quality/compliance information
3. Loop until all suppliers are processed, then hand off to Agent 2

### Agent 2 Flow
1. **start_verification**: Reset verification index
2. **verify_supplier**: For each supplier result, fetch source URLs, extract fields with Gemini, compare against requirements
3. Loop until all suppliers are verified

## State Definition

```python
class OverallState(TypedDict):
    ingredient_name: str
    suppliers: list[dict]           # From DB query
    supplier_idx: int               # Research loop counter
    results: list[SupplierResult]   # Agent 1 outputs (annotated: append-only)
    verify_idx: int                 # Verification loop counter
    verifications: list[VerificationResult]  # Agent 2 outputs (annotated: append-only)
```

## Components

### Database Layer (`db.py`)

- Queries SQLite database at `data/db.sqlite`
- Finds suppliers via SKU slug matching (`ingredient.lower().replace(" ", "-")`)
- SQL joins: `Supplier` -> `Supplier_Product` -> `Product` (where `Type = 'raw-material'`)
- Returns: `supplier_id`, `supplier_name`, `skus[]` (comma-separated, split into list)

### Research Node (`graph.py: research_supplier`)

- Creates a Gemini ReAct agent with Tavily search tool (max 4 results)
- Sends a detailed prompt asking to find: product pages, TDS, COA, SDS, certifications, purity specs
- Suggests 8 search query templates per supplier
- Extracts URLs from Tavily tool messages in agent history
- Runs structured extraction via `QualityProperties` Pydantic model
- Proactive rate limit delay (`_RATE_LIMIT_DELAY = 10s`) between calls
- Retry with exponential backoff on 429 errors (max 3 retries)

### Quality Properties Model (`models.py: QualityProperties`)

Structured extraction target with 17 fields:

| Field | Type | Description |
|---|---|---|
| `product_name` | str? | Supplier's product name |
| `product_url` | str? | Direct product page URL |
| `tds_url` | str? | TDS document URL |
| `coa_url` | str? | COA document URL |
| `sds_url` | str? | SDS document URL |
| `certifications` | str[] | Quality certs (USP, NSF, Kosher, Halal, Non-GMO, Organic) |
| `purity` | str? | Assay specification |
| `form` | str? | Physical form |
| `grade` | str? | Grade (USP, Food Grade, Pharma, FCC) |
| `particle_size` | str? | Particle size spec |
| `origin` | str? | Country of origin |
| `storage_conditions` | str? | Storage requirements |
| `shelf_life` | str? | Shelf life period |
| `gmp_certified` | bool? | GMP certification |
| `iso_certifications` | str[] | ISO standards held |
| `pharmacopoeia_compliance` | str[] | Pharmacopoeia standards met |
| `third_party_tested` | bool? | Independent testing |
| `gras_status` | str? | FDA GRAS status |
| `notes` | str? | Other quality notes |

### Verification Pipeline (`verify.py`)

Full verification for a single `SupplierResult`:

**Step 1 - Seed from Agent 1 data:**
- Converts `QualityProperties` into `ExtractedField` entries
- Seeds: purity, form, grade, particle_size, storage_conditions, shelf_life, gras_status, origin, gmp_certified, certifications, iso_certifications, pharmacopoeia_compliance, kosher, halal, non_gmo
- All seeded fields start with `source_confidence: "medium"`

**Step 2 - Fetch URLs:**
- Gathers all URLs from search results + quality property URLs (product, TDS, COA, SDS)
- Fetches each URL via httpx with browser-like User-Agent header
- Handles HTML (strip tags, cap at 6K chars) and PDF (via pdfplumber, first 5 pages)
- Timeout: 20s per URL

**Step 3 - Gemini extraction:**
- Builds a prompt with all fetched source text (budget: ~8K chars total, PDFs prioritized)
- Asks Gemini to extract every quality field with `source_confidence` rating
- Parses JSON response into `ExtractedField` objects

**Step 4 - Field normalization:**
- Maps raw field names to canonical names via `CANONICAL_FIELD_MAP` (100+ mappings)
- Handles: purity/assay/content, grade, form/appearance, heavy metals (Pb, As, Hg, Cd), particle size/mesh, loss on drying/moisture, pH, specific rotation, residue on ignition, certifications, microbial limits, storage/shelf life
- Validates plausibility: rejects CAS numbers, EC numbers, molecular formulas mapped to numeric fields
- Rejects unit-scale mismatches (% values to ppm fields and vice versa)
- Conflict resolution: higher confidence wins when multiple raw names map to same canonical

**Step 5 - Merge:**
- URL-extracted fields override Agent 1 seed fields (when equal or higher confidence)
- Agent 1 fields fill gaps where URL extraction found nothing

**Step 6 - Load requirements:**
- Reads from `data/requirements/{ingredient-slug}.json`
- Falls back gracefully if file not found

**Step 7 - Compare:**
- For each requirement: find matching extracted field
- Evaluate: numeric comparisons (>=, <=, range), boolean, enum ("in"), string
- Handles range values in actuals (e.g., "99.0%-100.5%")
- Low `source_confidence` automatically downgrades verdict to "fail"

**Step 8 - Compute confidence score:**
- Heuristic 0.0-1.0 combining evidence quality (30%), coverage (40%), pass rate (30%)
- Evidence quality: pdf_found=0.3, html_only=0.15, blocked/none=0.0

### Verification Models (`models.py`)

| Model | Fields |
|---|---|
| `ExtractedField` | `value`, `unit?`, `source_url?`, `source_confidence` (high/medium/low) |
| `ComparisonEntry` | `field`, `required`, `actual?`, `verdict` (pass/fail/missing), `priority` (critical/major/minor), `source_confidence` |
| `VerificationResult` | `supplier_name`, `ingredient`, `extracted_fields{}`, `comparison[]`, `missing_evidence[]`, `evidence_quality` (pdf_found/html_only/blocked/none), `confidence_score` (0.0-1.0), `sources[]` |

## CLI Usage

```bash
# Human-readable output
python -m src.supplier_research.main "calcium citrate"

# JSON output
python -m src.supplier_research.main "vitamin d3" --json
```

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `GOOGLE_API_KEY` | yes | Gemini API access |
| `TAVILY_API_KEY` | yes | Web search via Tavily |

## LLM Configuration

- Model: `gemma-4-31b-it` (configured in `_build_llm()`)
- Temperature: 0
- Rate limit delay: 10 seconds between calls
- Max retries on 429: 3 (with exponential backoff)

## Pre-computed Requirements

Three JSON files in `data/requirements/`:

| File | Ingredient |
|---|---|
| `calcium-citrate.json` | Calcium Citrate |
| `vitamin-c.json` | Vitamin C |
| `vitamin-d3.json` | Vitamin D3 |

These contain `requirements[]` with `field`, `operator`, `value`, `unit`, `priority` for comparison.
