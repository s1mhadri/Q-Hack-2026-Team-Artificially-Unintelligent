# Layer 3 - Quality Verification Layer

## Purpose

Retrieve supplier evidence (TDS, COA, product pages) and determine whether each candidate supplier meets the defined requirements. This is the core trust and evidence layer -- it does not make final sourcing decisions, only reports what was found, what was extracted, and what passed/failed/remains unknown.

## Status: Specification Complete, Implementation Pending

- Full specification at `quality_verification_layer_spec.md`
- API endpoint at `/api/layer3` returns simulated data
- The `src/supplier_research/verify.py` module implements a parallel approach via the LangGraph agent system

## Input Contract

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
      "field_name": "assay_percent",
      "rule_type": "range",
      "operator": "between",
      "min_value": 99.0,
      "max_value": 100.5,
      "unit": "%",
      "priority": "hard",
      "source_reference": "USP"
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
      }
    }
  ],
  "run_config": {
    "max_evidence_per_supplier": 10,
    "allowed_source_types": ["tds", "coa", "product_page", "certification_page"],
    "strict_mode": false
  }
}
```

## Output Contract

```json
{
  "schema_version": "1.0",
  "ingredient_id": "ING-ASCORBIC-ACID",
  "supplier_assessments": [
    {
      "supplier_id": "SUP-001",
      "evidence_items": [ /* EvidenceItem[] */ ],
      "extracted_attributes": [ /* ExtractedAttribute[] */ ],
      "verification_results": [ /* VerificationResult[] */ ],
      "coverage_summary": {
        "requirements_total": 2,
        "hard_pass": 1,
        "hard_fail": 0,
        "hard_unknown": 0,
        "soft_pass": 0,
        "soft_fail": 0,
        "soft_unknown": 1
      },
      "overall_evidence_confidence": "medium",
      "overall_status": "verified_with_gaps",
      "notes": ["No heavy metals value found in retrieved evidence"]
    }
  ]
}
```

## Specified Internal Submodules

### 1. Evidence Retrieval Module
- Takes one supplier + ingredient
- Searches likely evidence locations
- Retrieves supported documents
- Labels source type, deduplicates

### 2. Evidence Classification Module
- Classifies each source as TDS, COA, product page, etc.
- Filters out irrelevant pages

### 3. Parsing and Extraction Module
- Parses text from retrieved documents
- Extracts candidate values for supported fields
- Associates each value with source evidence

### 4. Normalization Module
- Canonical field naming
- Unit normalization (`99.7 %` -> `99.7`, unit `%`)
- Numeric parsing (`NMT 10 ppm` -> max value `10`, unit `ppm`)
- Range parsing, boolean normalization
- Deduplication

### 5. Verification Module
- Matches requirements to extracted attributes
- Applies comparison logic
- Produces VerificationResult objects

### 6. Assessment Aggregation Module
- Summarizes requirement checks per supplier
- Calculates coverage statistics
- Assigns overall evidence confidence and assessment status

## Supported Field Set (Minimum PoC)

| Field | Type | Units |
|---|---|---|
| `assay_percent` | numeric | % |
| `loss_on_drying_percent` | numeric | % |
| `heavy_metals_ppm` | numeric | ppm |
| `lead_ppm` | numeric | ppm |
| `arsenic_ppm` | numeric | ppm |
| `particle_size_mesh` | numeric | mesh |
| `pH` | numeric | - |
| `shelf_life_months` | numeric | months |
| `grade_claims` | enum | - |
| `certifications` | enum | - |
| `appearance` | text | - |
| `micro_limits` | complex | varies |

## Source Prioritization Policy

When multiple evidence sources exist:

1. COA (strongest - batch-specific)
2. TDS (stronger than generic pages)
3. Certification page
4. Product specification page
5. Marketing page (weak evidence only)

## Conflict Resolution Policy

- Prefer stronger evidence type over weaker
- If equal types conflict: keep both, reduce confidence
- Emit a note in supplier assessment
- Mark as `partial` or `unknown` if unresolvable

## Acceptance Criteria

1. Accepts the agreed JSON input contract
2. Processes at least 1 ingredient and 3 candidate suppliers
3. Retrieves or ingests evidence for each supplier
4. Extracts at least 3 canonical fields from structured evidence
5. Verifies hard requirements (pass/fail/unknown)
6. Exposes evidence IDs and confidence
7. Returns one assessment per candidate even when evidence is missing
8. Runs with sample input, produces sample output
9. Ships with unit and integration tests
10. Documents assumptions and limitations
