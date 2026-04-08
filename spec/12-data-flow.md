# Data Flow & Integration

## End-to-End Pipeline

```
User selects ingredient
        |
        v
   +---------+     +----------+     +----------+     +----------+
   | Layer 1  | --> | Layer 2  | --> | Layer 3  | --> | Layer 4  |
   | Require- |     | Compete- |     | Quality  |     | Recom-   |
   | ments    |     | Discovery|     | Verify   |     | mendation|
   +---------+     +----------+     +----------+     +----------+
        |                |                |                |
        v                v                v                v
   Requirements    Candidate         Verification    Final Decision
   Rules           Suppliers         Results         + Explanation
```

## Layer-to-Layer Data Dependencies

### Layer 1 -> Layer 2

**What Layer 2 receives from Layer 1:**
- `IngredientRef` (required)
- Requirements (optional, via `requirements_context`)

**How it's used:**
- Ingredient name and aliases drive search queries
- Requirements context can inform grade hints for query planning

### Layer 2 -> Layer 3

**What Layer 3 receives from Layer 2:**
- `IngredientRef`
- `candidate_suppliers[]` with evidence hints
- Requirements from Layer 1

**How it's used:**
- Each candidate supplier is evaluated for evidence
- Evidence hints guide where to look first (product pages, PDFs)
- Requirements define what fields to extract and verify

### Layer 3 -> Layer 4

**What Layer 4 receives from Layer 3:**
- `supplier_assessments[]` with:
  - Evidence items found
  - Extracted attributes
  - Verification results (pass/fail/unknown per requirement)
  - Coverage summaries
  - Overall evidence confidence

**How it's used:**
- Hard requirement pass/fail drives accept/reject decisions
- Unknown requirements trigger `conditional_accept`
- Confidence scores inform `decision_confidence`
- Evidence IDs provide traceability

## Frontend -> Backend Data Flow

```
Browser (Next.js)                  FastAPI (port 8000)
==================                 ==================
                                    
GET /api/layer1?ingredient=X  --->  import runner.run()
                              <---  Layer1Output JSON
                                    
GET /api/layer2               --->  import run_from_json()
                              <---  CompetitorOutput JSON
                                    
GET /api/layer3               --->  (simulated)
                              <---  Hardcoded JSON
                                    
GET /api/layer4               --->  (simulated)
                              <---  Hardcoded JSON
```

In development, Next.js proxies `/api/*` to `http://127.0.0.1:8000/api/*`.
In production (Vercel), `/api/*` routes to the Python serverless function.

## Supplier Research Agent Data Flow (Alternative Path)

```
CLI: "calcium citrate"
        |
        v
   +----------+
   | query_db  |  SQLite lookup: ingredient -> suppliers
   +----------+
        |
        v (for each supplier, sequentially)
   +------------------+
   | research_supplier |  Gemini ReAct agent + Tavily search
   +------------------+    -> SupplierResult (quality properties, URLs, raw findings)
        |
        v (for each result, sequentially)
   +-------------------+
   | verify_supplier    |  Fetch URLs -> Gemini extraction -> normalize -> compare
   +-------------------+    -> VerificationResult (comparisons, confidence, evidence)
        |
        v
   Final State: results[] + verifications[]
```

## Integration Conventions

### Schema Versioning
Every JSON payload includes `"schema_version": "1.0"`.

### Stable IDs
| Object | Format | Example |
|---|---|---|
| Ingredient | `ING-{NAME}` | `ING-ASCORBIC-ACID` |
| Supplier | `SUP-{ID}` | `SUP-001`, `SUP-BASF` |
| Requirement | `REQ-{ING}-{SEQ}` | `REQ-ING-ASCORBIC-ACID-001` |
| Evidence | `EVID-{SEQ}` | `EVID-001` |
| Attribute | `ATTR-{SEQ}` | `ATTR-001` |
| Verification | `VER-{SEQ}` | `VER-001` |

### Missing Data Handling
Missing data is never silently dropped. Explicit statuses:
- `unknown` - no evidence found
- `partial` - ambiguous evidence
- `insufficient_evidence` - not enough data to determine

### Plug-and-Play Rules
Each layer supports:
1. **File or API input** - can consume JSON from file or HTTP endpoint
2. **JSON output** - must export structured JSON using agreed schema
3. **Mock inputs** - can run with mock data when upstream not ready
4. **No internal coupling** - depends only on schema contracts, not upstream code

## n8n Workflow (Alternative Integration)

`workflows/supplier_gemini_research.json` defines a 6-node n8n workflow:

```
Manual Trigger -> Set Ingredient -> Query Suppliers -> Build Prompt -> Call Gemini -> Extract Results
```

This provides a no-code alternative for running the supplier research pipeline.
