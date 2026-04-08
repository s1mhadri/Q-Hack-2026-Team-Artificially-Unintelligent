# Frontend Application

## Technology

| Component | Version |
|---|---|
| Next.js | 16.2.3 |
| React | 19.2.4 |
| TypeScript | ^5 |

## Pages

### Layout (`src/app/layout.tsx`)

Root layout providing the application shell:

- **Sidebar navigation** with sections:
  - Operations: Dashboard, Agnes Workspace (active), Knowledge Base
  - System: Settings
- **Top bar** with title "Supplier Consolidation Engine" and "New Analysis" button
- **Content area** renders page children
- **Metadata**: title "Agnes Workspace | AI Supply Chain Manager"
- Dark theme via `globals.css`

### Main Workspace (`src/app/page.tsx`)

Client component (`"use client"`) implementing the 4-layer interactive workspace.

**State:**
- `activeTab`: which layer tab is selected (`layer1` | `layer2` | `layer3` | `layer4`)
- `loading`: per-layer loading state (`Record<string, boolean>`)
- `results`: per-layer API response data (`Record<string, any>`)

**Tab navigation:**
1. "1. Requirements Inference"
2. "2. Supplier Discovery"
3. "3. Quality Verification"
4. "4. Consensus & Decision"

**Per-tab panels:**

Each tab has a glass-panel card with:
- Title and description
- "Run Layer N Test" button that calls `runTest(layer, endpoint)`
- Loading state with spinner/pulse animation
- Results displayed as formatted JSON (`<pre>` with `JSON.stringify(data, null, 2)`)
- Empty state prompt when no results

**API calls:**
| Tab | Endpoint | Method |
|---|---|---|
| Layer 1 | `/api/layer1?ingredient=Ascorbic+Acid` | GET |
| Layer 2 | `/api/layer2` | GET |
| Layer 3 | `/api/layer3` | GET |
| Layer 4 | `/api/layer4` | GET |

**Fetch implementation:**
```typescript
const runTest = async (layer: string, endpoint: string) => {
  setLoading(prev => ({ ...prev, [layer]: true }));
  try {
    const res = await fetch(endpoint);
    const data = await res.json();
    setResults(prev => ({ ...prev, [layer]: data }));
  } catch (err) {
    setResults(prev => ({ ...prev, [layer]: { error: "Failed to fetch from backend" } }));
  }
  setLoading(prev => ({ ...prev, [layer]: false }));
};
```

**Styling:**
- Dark theme with CSS custom properties
- Glass-panel cards with frosted glass effect
- Inline SVG icons for each layer
- CSS animations: `spin` (loading spinner), `animate-pulse` (loading text)
- Color-coded JSON output per layer (gray, amber, green, blue)

## Styling

### `globals.css`
- Dark theme with CSS custom properties:
  - `--accent-primary`: accent color
  - `--text-secondary`, `--text-tertiary`: text hierarchy
  - `--border-subtle`: border color
- Glass-panel effect: semi-transparent backgrounds with backdrop blur
- Tab navigation with active indicator
- Button styles with hover states
- Responsive layout with sidebar + main content

## API Proxy

Frontend requests to `/api/*` are proxied to the FastAPI backend:

**Development** (`next.config.ts`):
```typescript
async rewrites() {
  return [{
    source: "/api/:path*",
    destination: "http://127.0.0.1:8000/api/:path*",
  }];
}
```

**Production** (`vercel.json`):
```json
{
  "rewrites": [{
    "source": "/api/(.*)",
    "destination": "/api/index.py"
  }]
}
```
