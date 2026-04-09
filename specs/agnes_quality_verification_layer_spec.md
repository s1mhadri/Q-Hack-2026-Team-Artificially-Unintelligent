# Agnes Quality Verification Layer Spec

**Version:** 1.0  
**Status:** Implemented  
**Scope:** Quality Verification Layer only (Layer 3)  
**Last updated:** 2026-04-09  
**Package:** `src/quality_verification_layer/`

---

## 1. Purpose

The Quality Verification Layer determines whether candidate suppliers for a selected ingredient satisfy the requirements defined by the Requirements Layer.

It does **not** decide whether a supplier should ultimately be chosen. Its job is to:

1. retrieve technical evidence (TDS, COA, product pages),
2. classify each source by type,
3. extract structured quality attributes via Gemini,
4. normalize field names to a canonical schema,
5. compare extracted values against requirement rules,
6. return a traceable verification result with explicit confidence and uncertainty.

---

## 2. Scope

### In scope
- Retrieving public technical evidence (TDS, COA, product specification pages, certification pages)
- Classifying sources by type (COA, TDS, certification, product, marketing)
- Parsing and extracting quality-related attributes via Gemini LLM
- Normalizing extracted values into a canonical schema (70+ field mappings)
- Checking extracted values against requirement rules
- Producing supplier-level verification summaries with coverage counts
- Surfacing uncertainty, missing evidence, and conflict notes
- Exposing machine-readable JSON outputs for the Recommendation Layer

### Out of scope
- Finding suppliers from scratch (that is Layer 2 — Competitor Layer)
- Defining benchmark rules (that is Layer 1 — Requirements Layer)
- Making final sourcing recommendations (that is Layer 4)
- Cost optimization
- Legal or regulatory signoff

---

## 3. Ownership Boundary

### Inputs owned by upstream layers
- Ingredient identity (from Layer 0/1/2)
- Candidate supplier list (from Layer 2 — Competitor Layer)
- Requirement rules (from Layer 1 — Requirements Layer)

### Outputs owned by this layer
- Evidence inventory with per-source classification and status
- Extracted attributes with provenance (source evidence IDs)
- Verification results (pass/fail/unknown/partial per requirement)
- Coverage summary (hard/soft breakdown)
- Supplier assessment summary with overall status and confidence

---

## 4. Input Contract

```json
{
  "schema_version": "1.0",
  "ingredient": {
    "ingredient_id": "ING-ASCORBIC-ACID",
    "canonical_name": "Ascorbic Acid",
    "aliases": ["Vitamin C", "L-Ascorbic Acid"],
    "category": "food ingredient"
  },
  "requirements": [
    {
      "requirement_id": "REQ-ASC-001",
      "field_name": "purity",
      "rule_type": "range",
      "operator": "between",
      "min_value": 99.0,
      "max_value": 100.5,
      "unit": "%",
      "priority": "hard",
      "source_reference": "USP"
    },
    {
      "requirement_id": "REQ-ASC-002",
      "field_name": "heavy_metals",
      "rule_type": "maximum",
      "operator": "<=",
      "max_value": 10,
      "unit": "ppm",
      "priority": "soft",
      "source_reference": "benchmark synthesis"
    }
  ],
  "candidate_suppliers": [
    {
      "supplier": {
        "supplier_id": "SUP-001",
        "supplier_name": "Example Supplier",
        "country": "DE",
        "website": "https://example.com"
      },
      "candidate_confidence": "high",
      "evidence_hints": {
        "website_found": true,
        "product_page_found": true,
        "technical_docs_likely": true
      },
      "source_urls": [
        "https://example.com/products/ascorbic-acid",
        "https://example.com/docs/ascorbic-acid-tds.pdf"
      ]
    }
  ],
  "run_config": {
    "max_evidence_per_supplier": 10,
    "allowed_source_types": ["tds", "coa", "product_page", "certification_page"],
    "strict_mode": false
  }
}
```

### Compatibility

The `RequirementInput` model accepts both:
- This spec's format (field_name, rule_type, min_value, max_value)
- Layer 1's `RequirementRule` output format (field_name, rule_type, operator, allowed_values, required)

The `CandidateSupplier` model accepts output from Layer 2's `Candidate.supplier` fields directly.

---

## 5. Output Contract

```json
{
  "schema_version": "1.0",
  "ingredient_id": "ING-ASCORBIC-ACID",
  "supplier_assessments": [
    {
      "supplier_id": "SUP-001",
      "evidence_items": [
        {
          "evidence_id": "EVID-SUP-001-001",
          "source_type": "tds",
          "source_url": "https://example.com/docs/ascorbic-acid-tds.pdf",
          "title": "Ascorbic Acid Technical Data Sheet",
          "status": "retrieved",
          "retrieved_at": "2026-04-09T12:00:00Z"
        }
      ],
      "extracted_attributes": [
        {
          "attribute_id": "ATTR-SUP-001-001",
          "field_name": "purity",
          "value": 99.7,
          "unit": "%",
          "source_evidence_id": "EVID-SUP-001-001",
          "confidence": "high",
          "extraction_method": "llm_extraction"
        }
      ],
      "verification_results": [
        {
          "verification_id": "VER-SUP-001-001",
          "requirement_id": "REQ-ASC-001",
          "field_name": "purity",
          "status": "pass",
          "observed_value": 99.7,
          "unit": "%",
          "confidence": "high",
          "reason": "Observed 99.7% is within range 99.0-100.5%",
          "supporting_evidence_ids": ["EVID-SUP-001-001"]
        }
      ],
      "coverage_summary": {
        "requirements_total": 2,
        "hard_pass": 1,
        "hard_fail": 0,
        "hard_unknown": 0,
        "soft_pass": 1,
        "soft_fail": 0,
        "soft_unknown": 0
      },
      "overall_evidence_confidence": "high",
      "overall_status": "verified",
      "notes": []
    }
  ]
}
```

---

## 6. Shared Data Objects

### EvidenceItem

One retrieved source document or page.

| Field | Type | Description |
|---|---|---|
| evidence_id | string | Unique ID (format: `EVID-{supplier_id}-{seq}`) |
| source_type | SourceType | coa, tds, certification_page, product_page, marketing_page, other |
| source_url | string | URL that was fetched |
| title | string? | Document title if known |
| status | EvidenceStatus | retrieved, unreachable, blocked, irrelevant, parse_failed |
| retrieved_at | string | ISO 8601 timestamp |

### ExtractedAttribute

One normalized value extracted from evidence.

| Field | Type | Description |
|---|---|---|
| attribute_id | string | Unique ID (format: `ATTR-{supplier_id}-{seq}`) |
| field_name | string | Canonical field name (e.g. `purity`, `heavy_metals`) |
| value | float or string | Extracted value |
| unit | string? | Unit (%, ppm, mesh, etc.) |
| source_evidence_id | string | Links back to the EvidenceItem it came from |
| confidence | Confidence | high, medium, low |
| extraction_method | ExtractionMethod | llm_extraction, document_parser, heuristic, seed |

### VerificationResultItem

Result of checking one extracted value against one requirement.

| Field | Type | Description |
|---|---|---|
| verification_id | string | Unique ID (format: `VER-{supplier_id}-{seq}`) |
| requirement_id | string | Links to the input requirement |
| field_name | string | Which field was checked |
| status | VerificationStatus | pass, fail, unknown, partial |
| observed_value | float or string? | What was found |
| unit | string? | Unit of observed value |
| confidence | Confidence | high, medium, low |
| reason | string | Human-readable explanation |
| supporting_evidence_ids | list[string] | Links to EvidenceItems supporting this result |

---

## 7. Status Enums

### Evidence status
- `retrieved` — document successfully fetched and parsed
- `unreachable` — HTTP error or timeout
- `blocked` — 403 or access denied
- `irrelevant` — fetched but not relevant to ingredient
- `parse_failed` — fetched but content could not be parsed

### Verification status
- `pass` — extracted value satisfies the requirement
- `fail` — extracted value violates the requirement
- `unknown` — no value found for this field in any evidence
- `partial` — ambiguous match or low-confidence pass (downgraded)

### Supplier assessment status
- `verified` — all hard requirements pass, no unknowns
- `verified_with_gaps` — some hard requirements pass but unknowns remain
- `failed_hard_requirements` — at least one hard requirement fails
- `insufficient_evidence` — no usable evidence retrieved
- `processing_error` — pipeline error during processing

### Confidence
- `high` — direct value from COA/TDS, no conflicts
- `medium` — value from product page or partially structured document
- `low` — weak evidence, ambiguous, or conflicting sources

### Source type
- `coa` — Certificate of Analysis (batch-specific, strongest)
- `tds` — Technical Data Sheet
- `certification_page` — certification/compliance page
- `product_page` — product listing/catalog page
- `marketing_page` — general marketing content
- `other` — unclassifiable

### Extraction method
- `llm_extraction` — extracted by Gemini from document text
- `document_parser` — extracted by deterministic parser
- `heuristic` — inferred by rule-based heuristic
- `seed` — seeded from upstream layer data

---

## 8. Internal Architecture

The layer is implemented as 6 functional submodules:

### 8.1 Evidence Retrieval (`retrieval.py`)
- Fetches URLs via httpx (HTML and PDF)
- Extracts PDF text via pdfplumber (first 5 pages)
- Assigns EvidenceItem with status and timestamp
- Respects `run_config.max_evidence_per_supplier`

### 8.2 Evidence Classification (`classification.py`)
- Classifies each fetched source as COA, TDS, certification page, product page, etc.
- Uses URL path patterns (e.g. `/coa`, `/tds`, `.pdf`)
- Uses content heuristics (e.g. "Certificate of Analysis", "Lot No:", "Technical Data Sheet")

### 8.3 Field Extraction (`extraction.py`)
- Gemini-powered extraction of all quality fields from document text
- Prompt asks for snake_case field names with value, unit, source_url, and source_confidence
- Returns list of ExtractedAttribute with attribute IDs and evidence linking

### 8.4 Normalization (`normalization.py`)
- 70+ field name mappings from raw extracted names to canonical names
- Three-step matching: exact → ingredient-word-stripped → substring (longest first)
- Plausibility validation: rejects CAS numbers, molecular formulas, and unit-scale mismatches
- Conflict resolution: when multiple attributes map to same field, prefers higher confidence → stronger source type (COA > TDS > product)

### 8.5 Verification (`verification.py`)
- Evaluates each requirement against matched extracted attributes
- Supports 6 rule types: range, minimum, maximum, enum_match, boolean_required, free_text_reference
- Numeric parsing handles ranges (e.g. "99.0%-100.5%"), operators (NMT, NLT, ≤, ≥)
- Low-confidence pass is downgraded to `partial`
- Each result includes reason string and supporting evidence IDs

### 8.6 Assessment Aggregation (`aggregation.py`)
- Computes CoverageSummary: counts of hard/soft pass/fail/unknown
- Determines SupplierAssessmentStatus from coverage + evidence availability
- Computes overall confidence from evidence types + attribute confidence distribution

---

## 9. Source Prioritization Policy

When resolving conflicts between multiple sources:

1. **COA** (strongest — batch-specific)
2. **TDS**
3. **Certification page**
4. **Product specification page**
5. **Marketing page** (weakest)

Higher-confidence attributes always win. When confidence is equal, stronger evidence type wins. Conflicts emit notes in the supplier assessment.

---

## 10. Supported Fields

### Canonical field set (implemented)

| Field | Type | Typical unit |
|---|---|---|
| purity | numeric | % |
| potency | numeric | % |
| heavy_metals | numeric | ppm |
| lead | numeric | ppm |
| arsenic | numeric | ppm |
| mercury | numeric | ppm |
| cadmium | numeric | ppm |
| loss_on_drying | numeric | % |
| particle_size | numeric | mesh |
| mesh_size | numeric | mesh |
| ph | numeric | — |
| specific_rotation | numeric | degrees |
| residue_on_ignition | numeric | % |
| shelf_life | numeric | months |
| total_plate_count | numeric | CFU/g |
| yeast_mold | numeric | CFU/g |
| grade | enum | — |
| certifications | enum | — |
| appearance | text | — |
| form | text | — |
| storage_conditions | text | — |
| gmp_certified | boolean | — |
| kosher | boolean | — |
| halal | boolean | — |
| non_gmo | boolean | — |

---

## 11. Supported Rule Types

| Rule type | Operator | Fields | Example |
|---|---|---|---|
| range | between | min_value, max_value | purity 99.0–100.5% |
| minimum | >= | min_value | purity >= 99.0% |
| maximum | <= | max_value | heavy_metals <= 10 ppm |
| enum_match | in | allowed_values | grade in [USP, FCC] |
| boolean_required | == | required | gmp_certified == true |
| free_text_reference | — | reference_text | Returns `partial` |

---

## 12. Configuration

Environment variables (loaded via `.env`):

| Variable | Default | Description |
|---|---|---|
| GEMINI_API_KEY | — | Google Gemini API key (required for extraction) |
| GEMINI_MODEL | gemini-2.5-flash | Gemini model for extraction |
| QV_MAX_EVIDENCE_PER_SUPPLIER | 10 | Max URLs to fetch per supplier |
| QV_RATE_LIMIT_DELAY | 1.0 | Delay between Gemini calls (seconds) |
| QV_FETCH_TIMEOUT | 20 | HTTP fetch timeout (seconds) |

---

## 13. CLI Interface

```bash
quality-verification input.json                     # output to stdout
quality-verification input.json -o output.json      # output to file
quality-verification input.json --compact            # compact JSON
```

### Programmatic API

```python
from quality_verification_layer import run_quality_verification
from quality_verification_layer.config import load_config
from quality_verification_layer.schemas import QualityVerificationInput

input_data = QualityVerificationInput.model_validate(json_dict)
output = run_quality_verification(input_data, load_config())
```

Convenience functions:
- `run_from_json(json_str) -> str`
- `run_from_file(path) -> QualityVerificationOutput`

---

## 14. Pipeline Flow

For each candidate supplier:

```
1. retrieve_evidence()        → list[EvidenceItem] + list[FetchedSource]
2. classify_evidence_items()  → EvidenceItems updated with source_type
3. extract_attributes()       → list[ExtractedAttribute] via Gemini
4. normalize_attributes()     → canonical field names applied
5. resolve_conflicts()        → deduplicated attributes + conflict notes
6. verify_requirements()      → list[VerificationResultItem]
7. compute_coverage_summary() → CoverageSummary
8. compute_overall_status()   → SupplierAssessmentStatus
9. compute_overall_confidence() → Confidence
10. assemble SupplierAssessment
```

---

## 15. Traceability Chain

Every output links back to its source:

```
EvidenceItem.evidence_id
    ↓
ExtractedAttribute.source_evidence_id
    ↓
VerificationResultItem.supporting_evidence_ids
```

This enables downstream layers (and human reviewers) to trace any pass/fail decision back to the specific document and URL it came from.

---

## 16. Error Handling

### Document-level failures
Failed retrievals produce EvidenceItems with status `unreachable`, `blocked`, or `parse_failed`. These are included in the output — never silently dropped.

### Supplier-level failures
If all evidence retrieval fails, the supplier assessment status is set to `processing_error` or `insufficient_evidence`. The supplier is still included in the output with explicit failure status.

### Extraction failures
If Gemini returns invalid JSON or no response, extraction returns an empty attribute list. Verification results for all requirements become `unknown`.

---

## 17. Test Coverage

69 tests across 6 test files:

| File | Tests | Covers |
|---|---|---|
| test_schemas.py | 10 | Input/output parsing, round-trip, enum enforcement |
| test_normalization.py | 13 | Field mapping, plausibility, CAS rejection, unit validation |
| test_verification.py | 14 | All 6 rule types, missing values, traceability, confidence downgrade |
| test_aggregation.py | 11 | Coverage counts, overall status classification, confidence levels |
| test_retrieval.py | 10 | Status mapping, FetchedSource, ID generation |
| test_integration.py | 11 | Full pipeline, multiple suppliers, contract compatibility |

---

## 18. Package Structure

```
src/quality_verification_layer/
    pyproject.toml
    README.md
    .env.example
    quality_verification_layer/
        __init__.py
        schemas.py
        config.py
        id_generator.py
        retrieval.py
        classification.py
        extraction.py
        gemini_wrapper.py
        normalization.py
        verification.py
        aggregation.py
        runner.py
        cli.py
    config/
        fields.json
        source_priority.json
    inputs/
        sample_input.json
    outputs/
        sample_output.json
    tests/
        conftest.py
        test_schemas.py
        test_normalization.py
        test_verification.py
        test_aggregation.py
        test_retrieval.py
        test_integration.py
```

---

## 19. Dependencies

- Python >= 3.12
- pydantic >= 2.0
- python-dotenv >= 1.0
- httpx >= 0.27
- pdfplumber >= 0.10
- google-genai >= 1.0

---

## 20. Known PoC Limitations

- Supports 3–4 ingredient families
- Limited to ~25 canonical fields
- Relies on public documents only
- Gemini required for field extraction (no extraction without API key)
- Heuristic confidence scoring (not ML-based)
- Source classification uses URL patterns and content heuristics (not deep document understanding)
- Limited conflict resolution (preference-based, not value reconciliation)

---

## 21. Acceptance Criteria

The Quality Verification Layer is considered complete when it can:

1. Accept the JSON input contract with ingredient, requirements, and candidate suppliers
2. Process at least 3 candidate suppliers per run
3. Retrieve evidence from provided URLs (HTML and PDF)
4. Classify each source by type (COA, TDS, product page, etc.)
5. Extract at least 3 canonical fields from structured evidence via Gemini
6. Normalize field names using the 70+ canonical mapping
7. Verify hard and soft requirements, returning pass/fail/unknown/partial
8. Expose evidence IDs, attribute IDs, and verification IDs with full traceability
9. Compute coverage summary with hard/soft breakdown
10. Return one supplier assessment per candidate, even when evidence is missing
11. Run with sample input and produce valid sample output
12. Ship with 69+ unit and integration tests
