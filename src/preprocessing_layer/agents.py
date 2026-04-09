from typing import List, Optional
from .llm_client import generate_json
from .db_client import get_finished_goods_for_rm, get_supplier_for_rm

async def run_aliases_agent(canonical_name: str) -> List[str]:
    prompt = f"List 3-5 common chemical/trade aliases for the ingredient '{canonical_name}'. Return ONLY a JSON array of strings."
    # Define schema for Gemini: A list of strings
    schema = {"type": "ARRAY", "items": {"type": "STRING"}}
    result = await generate_json(prompt, schema)
    if isinstance(result, list):
        return result
    return []

async def run_context_agent(rm_sku: str, canonical_name: str) -> str:
    fgs = await get_finished_goods_for_rm(rm_sku)
    
    if not fgs:
        prompt = f"What is the most likely high-level product category (e.g., 'Personal Care / Cosmetics', 'Food & Beverage', 'Pharmaceuticals') for an ingredient named '{canonical_name}'? Return a JSON object with a single key 'category'."
    else:
        prompt = f"An ingredient named '{canonical_name}' is used to manufacture the following finished goods SKUs: {fgs}. Based on these SKUs, what is the most likely high-level product category (e.g., 'Personal Care / Cosmetics', 'Food & Beverage', 'Pharmaceuticals')? Return a JSON object with a single key 'category'."
    
    schema = {"type": "OBJECT", "properties": {"category": {"type": "STRING"}}}
    result = await generate_json(prompt, schema)
    if isinstance(result, dict) and "category" in result:
        return result["category"]
    return "Unknown"

async def run_supplier_agent(rm_sku: str) -> Optional[str]:
    # Pure DB task
    return await get_supplier_for_rm(rm_sku)
