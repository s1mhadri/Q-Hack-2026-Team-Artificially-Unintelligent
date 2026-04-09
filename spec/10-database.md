# Database

## Engine

SQLite, embedded at `data/db.sqlite`.

## Schema

The database contains the Q-Hack challenge dataset representing a CPG supply chain.

### Tables

#### `Company`
End brands / companies (e.g., "Mars").

#### `BOM` (Bill of Materials)
Collections of ingredients per product.

#### `BOM_Component`
Individual ingredients in a BOM. Filtered by `Type = 'raw-material'` to find actual ingredients (as opposed to packaging or other components).

#### `Product`
Raw materials with SKU slugs. The `SKU` field is the primary identifier used for matching ingredients to suppliers.

**SKU format:** lowercase, hyphen-separated (e.g., `ascorbic-acid`, `calcium-citrate`, `vitamin-d3`).

#### `Supplier`
Ingredient suppliers with `Id` and `Name`.

#### `Supplier_Product`
Junction table mapping suppliers to products: `SupplierId` -> `ProductId`.

### Entity Relationships

```
Company
  |
  v (has many)
BOM
  |
  v (has many)
BOM_Component --> Product
                    |
                    v (via Supplier_Product)
                  Supplier
```

## Query Pattern

The primary query used by the supplier research agent (`src/supplier_research/db.py`):

```sql
SELECT
    s.Id   AS supplier_id,
    s.Name AS supplier_name,
    GROUP_CONCAT(DISTINCT p.SKU) AS skus
FROM Supplier s
JOIN Supplier_Product sp ON s.Id = sp.SupplierId
JOIN Product p           ON sp.ProductId = p.Id
WHERE p.Type = 'raw-material'
  AND p.SKU LIKE ?
GROUP BY s.Id, s.Name
ORDER BY s.Name
```

**Matching strategy:** Ingredient name is converted to a slug (`ingredient.lower().replace(" ", "-")`) and matched via `LIKE %{slug}%` against `Product.SKU`.

## Pre-computed Requirements

Located at `data/requirements/`, these JSON files provide ground-truth quality requirements for the verification pipeline:

| File | Ingredient | Fields |
|---|---|---|
| `calcium-citrate.json` | Calcium Citrate | requirements with field, operator, value, unit, priority |
| `vitamin-c.json` | Vitamin C | requirements for ascorbic acid verification |
| `vitamin-d3.json` | Vitamin D3 | requirements for cholecalciferol verification |

These are consumed by `src/supplier_research/verify.py: load_requirements()`.
