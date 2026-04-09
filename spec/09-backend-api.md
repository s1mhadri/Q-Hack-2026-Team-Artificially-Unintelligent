# Backend API

## Technology

FastAPI with Uvicorn, running on port 8000 in development.

## File

`api/index.py`

## Configuration

- Docs URL: `/api/docs` (Swagger UI)
- OpenAPI URL: `/api/openapi.json`
- CORS: all origins, credentials, methods, and headers allowed

## Endpoints

### `GET /api`

Health check / root endpoint.

**Response:**
```json
{
  "ok": true,
  "message": "Agnes backend is live"
}
```

### `GET /api/health`

Status endpoint.

**Response:**
```json
{
  "status": "healthy"
}
```

### `GET /api/layer1`

Runs the Layer 1 Requirements Engine.

**Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `ingredient` | query string | `"Ascorbic Acid"` | Ingredient to analyze |

**Behavior:**
1. Constructs Layer 1 input payload from query parameter
2. Imports and calls `src.requirement_layer.runner.run(input_data)`
3. Returns the full Layer 1 output JSON
4. On any error (including `SystemExit`): returns error JSON with detail and note about missing `GEMINI_API_KEY`

**Response:** Layer 1 output contract (see Layer 1 spec)

### `GET /api/layer2`

Runs the Layer 2 Competitor Discovery Engine.

**Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `ingredient` | query string | `"Ascorbic Acid"` | Ingredient to search |

**Behavior:**
1. Constructs input payload with ingredient and US region context
2. Loads competitor layer config from environment
3. Falls back to mock search if no Tavily or Exa API keys configured
4. Calls `run_from_json(json_str, config)`
5. Returns parsed JSON output

**Response:** Layer 2 output contract (see Layer 2 spec)

### `GET /api/layer3`

Simulated Layer 3 Quality Verification.

**Behavior:**
- Artificial 2.5 second delay (`asyncio.sleep(2.5)`)
- Returns hardcoded simulated verification results

**Response:**
```json
{
  "status": "simulated",
  "verifications": [
    {"supplier": "GlobalChem", "assay_extracted": "99.2%", "pass": true, "confidence": 0.95},
    {"supplier": "NaturaIng", "assay_extracted": "99.5%", "pass": true, "confidence": 0.98},
    {"supplier": "StandardPowders", "assay_extracted": "Unknown", "pass": false, "confidence": 0.40}
  ]
}
```

### `GET /api/layer4`

Simulated Layer 4 Recommendation.

**Behavior:**
- Artificial 1.0 second delay (`asyncio.sleep(1.0)`)
- Returns hardcoded simulated recommendation

**Response:**
```json
{
  "status": "simulated",
  "recommendation": "Accept",
  "target_supplier": "NaturaIng",
  "explanation": "NaturaIng exceeds the 99.0% assay requirement (verified at 99.5%) and provides verifiable COA documentation.",
  "confidence": 0.92
}
```

## Path Setup

The API file manipulates `sys.path` to import from project modules:
```python
base_dir = Path(__file__).parent.parent
sys.path.insert(0, str(base_dir))
sys.path.insert(0, str(base_dir / "competitor_layer"))
```

## Development

```bash
# Run API server only
npm run dev:api
# equivalent to: python -m uvicorn api.index:app --reload --port 8000

# Run frontend + API concurrently
npm run dev
# equivalent to: concurrently "npm run dev:frontend" "npm run dev:api"
```
