# Layer 4 - Recommendation Layer

## Purpose

Combine prior layer outputs into a usable, explainable sourcing recommendation. Produces a final decision per supplier with supporting evidence and uncertainty presentation.

## Status: Specification Complete, Implementation Pending

- Specified in `spec.md` (section "Layer 4 -- Recommendation Layer")
- API endpoint at `/api/layer4` returns simulated data

## Input Contract

```json
{
  "schema_version": "1.0",
  "ingredient": {
    "ingredient_id": "ING-ASCORBIC-ACID",
    "canonical_name": "Ascorbic Acid"
  },
  "opportunity_context": null,
  "requirements": [],
  "candidate_suppliers": [],
  "supplier_assessments": []
}
```

Consumes outputs from all upstream layers:
- **Layer 0** (optional): `opportunity_context` with opportunity score
- **Layer 1**: `requirements[]` (RequirementRule objects)
- **Layer 2**: `candidate_suppliers[]` (Candidate objects)
- **Layer 3**: `supplier_assessments[]` (per-supplier verification results)

## Output Contract

```json
{
  "schema_version": "1.0",
  "ingredient_id": "ING-ASCORBIC-ACID",
  "recommendations": [
    {
      "supplier_id": "SUP-BASF",
      "decision": "conditional_accept",
      "decision_confidence": "medium",
      "summary": "Supplier meets known hard constraints, but one requirement remains unverified",
      "key_reasons": [
        "Assay passes required range",
        "Technical documentation retrieved successfully",
        "One hard requirement remains unknown"
      ],
      "supporting_evidence_ids": ["EVID-001"]
    }
  ]
}
```

## Decision Enum

| Value | Meaning |
|---|---|
| `accept` | Supplier fully meets all requirements with high confidence |
| `reject` | Supplier fails one or more hard requirements |
| `conditional_accept` | Supplier passes known checks but some requirements unverified |
| `insufficient_evidence` | Not enough evidence to make a determination |

## Responsibility Boundaries

**Responsible for:**
- Final synthesis across all layer outputs
- Decision logic combining requirement coverage, confidence, and evidence quality
- Explanation generation (human-readable `key_reasons`)
- Uncertainty presentation (explicit about what's known vs unknown)

**Not responsible for:**
- Benchmark extraction (Layer 1)
- Supplier search (Layer 2)
- Raw evidence parsing (Layer 3)
- Cost optimization or procurement workflow

## Current Simulated Response

The API endpoint currently returns a hardcoded response:

```json
{
  "status": "simulated",
  "recommendation": "Accept",
  "target_supplier": "NaturaIng",
  "explanation": "NaturaIng exceeds the 99.0% assay requirement (verified at 99.5%) and provides verifiable COA documentation.",
  "confidence": 0.92
}
```
