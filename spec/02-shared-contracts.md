# Cross-Layer Shared Data Contracts

All layers communicate via JSON payloads conforming to these shared object definitions. Every payload must include `"schema_version": "1.0"`.

## 1. IngredientRef

Represents the canonical ingredient being analyzed. The `ingredient_id` must be stable across all layers.

```json
{
  "ingredient_id": "ING-ASCORBIC-ACID",
  "canonical_name": "Ascorbic Acid",
  "aliases": ["Vitamin C", "L-Ascorbic Acid"],
  "category": "food ingredient"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `ingredient_id` | string | yes | Deterministic stable ID (e.g., `ING-ASCORBIC-ACID`) |
| `canonical_name` | string | yes | Human-readable name |
| `aliases` | string[] | no | Alternative names, E-numbers, trade names |
| `category` | string | no | Default: `"food ingredient"` |

## 2. SupplierRef

Represents a supplier candidate.

```json
{
  "supplier_id": "SUP-BASF",
  "supplier_name": "BASF",
  "country": "DE",
  "website": "https://example.com"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `supplier_id` | string | yes | Stable ID (e.g., `SUP-001`, `SUP-BASF`) |
| `supplier_name` | string | yes | |
| `country` | string | no | ISO 3166-1 alpha-2 |
| `website` | string | no | |

## 3. RequirementRule

Represents one quality requirement to evaluate.

```json
{
  "requirement_id": "REQ-ASC-001",
  "ingredient_id": "ING-ASCORBIC-ACID",
  "field_name": "assay_percent",
  "rule_type": "range",
  "operator": "between",
  "min_value": 99.0,
  "max_value": 100.5,
  "unit": "%",
  "priority": "hard",
  "source_reference": "USP",
  "notes": "Assay requirement for ascorbic acid"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `requirement_id` | string | yes | `REQ-{INGREDIENT}-{SEQ}` format |
| `ingredient_id` | string | no | Links back to IngredientRef |
| `field_name` | string | yes | Canonical field name (e.g., `assay_percent`) |
| `rule_type` | enum | yes | See Rule Types below |
| `operator` | string | yes | Comparison operator |
| `priority` | enum | yes | `hard` or `soft` |
| `source_reference` | string | yes | e.g., `"USP"`, `"FCC"`, `"benchmark synthesis"` |
| `unit` | string | no | e.g., `"%"`, `"ppm"` |
| `min_value` | float | conditional | Required for `range`, `minimum` |
| `max_value` | float | conditional | Required for `range`, `maximum` |
| `allowed_values` | string[] | conditional | Required for `enum_match` |
| `required` | boolean | conditional | Required for `boolean_required` |
| `reference_text` | string | conditional | Required for `free_text_reference` |
| `notes` | string | no | |

### Rule Types

| rule_type | operator | Required fields | Example |
|---|---|---|---|
| `range` | `between` | `min_value`, `max_value` | assay 99.0% - 100.5% |
| `minimum` | `>=` | `min_value` | purity >= 99.0% |
| `maximum` | `<=` | `max_value` | heavy metals <= 10 ppm |
| `enum_match` | `in` | `allowed_values` | grade in [USP, FCC] |
| `boolean_required` | `==` | `required` | halal certified == true |
| `free_text_reference` | `reference` | `reference_text` | conforms to USP monograph |

### Priority Classification

| Priority | Used for | Examples |
|---|---|---|
| `hard` | Safety-critical constraints | Assay purity, heavy metals limits, microbial limits, identity tests |
| `soft` | Processing/physical preferences | Particle size, color, pH, solubility, appearance |

## 4. EvidenceItem

Represents a retrieved technical document.

```json
{
  "evidence_id": "EVID-001",
  "supplier_id": "SUP-BASF",
  "ingredient_id": "ING-ASCORBIC-ACID",
  "source_type": "tds",
  "source_url": "https://example.com/spec.pdf",
  "title": "Ascorbic Acid Technical Data Sheet",
  "retrieved_at": "2026-04-08T10:00:00Z",
  "status": "retrieved"
}
```

### source_type enum

| Value | Description |
|---|---|
| `tds` | Technical Data Sheet |
| `coa` | Certificate of Analysis |
| `product_page` | Supplier product page |
| `certification_page` | Certification/compliance page |
| `regulatory_reference` | Regulatory standard document |
| `other` | Other document type |

### Evidence status enum

| Value | Description |
|---|---|
| `retrieved` | Successfully fetched |
| `unreachable` | URL not accessible |
| `blocked` | Access denied |
| `irrelevant` | Document not relevant |
| `parse_failed` | Could not extract content |

## 5. ExtractedAttribute

Represents a quality field extracted from evidence.

```json
{
  "attribute_id": "ATTR-001",
  "supplier_id": "SUP-BASF",
  "ingredient_id": "ING-ASCORBIC-ACID",
  "field_name": "assay_percent",
  "value": 99.7,
  "unit": "%",
  "source_evidence_id": "EVID-001",
  "confidence": "high",
  "extraction_method": "document_parser"
}
```

### Confidence enum

| Value | Meaning |
|---|---|
| `high` | Direct numeric value from COA/TDS, no conflict |
| `medium` | Value from product page or partially structured PDF |
| `low` | Inferred from weak text, ambiguous wording, or conflicting sources |

## 6. VerificationResult

Represents the result of comparing one extracted attribute against one requirement.

```json
{
  "verification_id": "VER-001",
  "supplier_id": "SUP-BASF",
  "ingredient_id": "ING-ASCORBIC-ACID",
  "requirement_id": "REQ-ASC-001",
  "field_name": "assay_percent",
  "status": "pass",
  "observed_value": 99.7,
  "unit": "%",
  "confidence": "high",
  "reason": "Observed assay is within required range",
  "supporting_evidence_ids": ["EVID-001"]
}
```

### Verification status enum

| Value | Meaning |
|---|---|
| `pass` | Requirement satisfied |
| `fail` | Requirement not met |
| `unknown` | No evidence found for this field |
| `partial` | Ambiguous evidence (e.g., `"food grade"` found but no explicit FCC mention) |

### Supplier assessment status enum (Layer 3 output)

| Value | Meaning |
|---|---|
| `verified` | All hard requirements pass |
| `verified_with_gaps` | Some requirements still unknown |
| `failed_hard_requirements` | One or more hard requirements fail |
| `insufficient_evidence` | No usable evidence found |
| `processing_error` | Pipeline error during verification |
