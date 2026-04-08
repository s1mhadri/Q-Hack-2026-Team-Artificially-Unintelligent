# Configuration & Deployment

## Environment Variables

### Root `.env.example`

| Variable | Required | Default | Used by |
|---|---|---|---|
| `GOOGLE_API_KEY` | yes | - | Layer 1 (as `GEMINI_API_KEY`), Supplier Research |
| `GEMINI_MODEL` | no | `gemma-4-31b-it` | Layer 1 |

### Competitor Layer `.env.example`

| Variable | Required | Default | Used by |
|---|---|---|---|
| `GEMINI_API_KEY` | optional | - | Layer 2 (Gemini-enhanced queries/ranking) |
| `GEMINI_MODEL` | no | `gemini-2.5-pro` | Layer 2 |
| `COMPETITOR_MAX_CANDIDATES` | no | `10` | Layer 2 |
| `COMPETITOR_RANKING_ENABLED` | no | `true` | Layer 2 |
| `GOOGLE_API_KEY` | optional | - | Layer 2 (Google CSE) |
| `GOOGLE_CSE_ID` | optional | - | Layer 2 (Google CSE) |
| `COMPETITOR_SEARCH_ENGINE` | no | `auto` | Layer 2 |
| `COMPETITOR_SEARCH_RESULTS_PER_QUERY` | no | `10` | Layer 2 |
| `COMPETITOR_SEARCH_DELAY` | no | `1.0` | Layer 2 |

### Supplier Research

| Variable | Required | Default | Used by |
|---|---|---|---|
| `GOOGLE_API_KEY` | yes | - | LangGraph agents (Gemini) |
| `TAVILY_API_KEY` | yes | - | LangGraph agents (web search) |

## Python Configuration (`pyproject.toml`)

```toml
[project]
name = "spherecast"
version = "0.1.0"
requires-python = ">=3.12"

[project.dependencies]
mcp>=1.27.0
openai>=2.30.0
pydantic>=2.12.5
python-dotenv>=1.2.2
notebook>=7.0.0
pandas>=2.0.0
matplotlib>=3.7.0
google-genai>=1.70.0

[dependency-groups]
dev = ["pytest>=9.0.3", "pytest-asyncio>=1.3.0", "pytest-cov>=7.1.0"]

[tool.setuptools.packages.find]
where = ["."]
include = ["src*"]

[tool.pytest.ini_options]
pythonpath = ["."]
```

## Node.js Configuration (`package.json`)

```json
{
  "name": "temp-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:api\"",
    "dev:frontend": "next dev",
    "dev:api": "python -m uvicorn api.index:app --reload --port 8000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### Dependencies

| Package | Version | Purpose |
|---|---|---|
| `next` | 16.2.3 | Frontend framework |
| `react` | 19.2.4 | UI library |
| `react-dom` | 19.2.4 | React DOM renderer |

### Dev Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@types/node` | ^20 | Node.js types |
| `@types/react` | ^19 | React types |
| `@types/react-dom` | ^19 | React DOM types |
| `concurrently` | ^9.2.1 | Run frontend + API simultaneously |
| `eslint` | ^9 | Linting |
| `eslint-config-next` | 16.2.3 | Next.js ESLint rules |
| `typescript` | ^5 | TypeScript compiler |

## TypeScript Configuration (`tsconfig.json`)

- Strict mode enabled
- Path alias: `@/*` -> `./src/*`

## Next.js Configuration (`next.config.ts`)

- API proxy: `/api/:path*` -> `http://127.0.0.1:8000/api/:path*` (development)

## Vercel Deployment (`vercel.json`)

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.py"
    }
  ]
}
```

In production on Vercel:
- Frontend: built and served as static/SSR by Vercel's Next.js integration
- Backend: `api/index.py` runs as a Vercel serverless Python function
- API routes are rewritten to the Python function

## Development Workflow

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies (via uv)
uv sync

# Run both frontend and API
npm run dev

# Run frontend only (port 3000)
npm run dev:frontend

# Run API only (port 8000)
npm run dev:api

# Run tests
pytest tests/ -v
pytest src/competitor_layer/tests/ -v

# Lint
npm run lint

# Build for production
npm run build
```

## .gitignore

Ignores:
- Node: `node_modules/`, `.next/`, `out/`, `build/`
- Python: `.venv/`, `__pycache__/`, `*.egg-info/`, `dist/`
- Environment: `.env`, `.env*`, `*.env`
- IDE/OS: `.DS_Store`, `.cursor/`, `.vercel`
- TypeScript build: `*.tsbuildinfo`, `next-env.d.ts`
- Layer-specific: `src/competitor_layer/demo_output/*`
