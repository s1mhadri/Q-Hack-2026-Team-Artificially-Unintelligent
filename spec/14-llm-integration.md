# LLM Integration

## Models Used

| Context | Model | SDK | Purpose |
|---|---|---|---|
| Layer 1 | `gemini-3-flash-preview` | `google-genai` | Requirement generation with Search Grounding |
| Layer 2 (queries) | `gemini-2.5-pro` | `google-genai` | Synonym expansion, query enhancement |
| Layer 2 (ranking) | `gemini-2.5-pro` / `gemini-2.5-flash` (fallback) | `google-genai` | Supplier classification, reasoning |
| Supplier Research (research) | `gemma-4-31b-it` | `langchain-google-genai` | ReAct agent for supplier research |
| Supplier Research (extract) | `gemma-4-31b-it` | `langchain-google-genai` | Structured quality property extraction |
| Supplier Research (verify) | `gemma-4-31b-it` | `langchain-google-genai` | Evidence field extraction from documents |

## Integration Patterns

### Pattern 1: Direct Gemini API (Layer 1)

```python
from google import genai
from google.genai import types

client = genai.Client(api_key=api_key)
response = client.models.generate_content(
    model="gemini-3-flash-preview",
    contents=history,     # list[Content] with user messages
    config=types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        tools=GEMINI_TOOLS,   # Google Search Grounding
    ),
)
```

- Uses Google Search Grounding as a tool for real-time web information
- System prompt instructs the model to produce structured JSON output
- Response parsing: strip markdown fences, extract JSON array or `requirements` key

### Pattern 2: Structured Output (Layer 2)

```python
from google import genai
from google.genai import types

response = client.models.generate_content(
    model=model,
    contents=prompt,
    config=types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=PydanticModel,
        temperature=0,
    ),
)
result = PydanticModel.model_validate_json(response.text)
```

- Forces JSON output matching a Pydantic schema
- Temperature 0 for deterministic output
- Primary + fallback model pattern (try expensive model first, fall back to cheaper one)

### Pattern 3: LangChain ReAct Agent (Supplier Research)

```python
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.tools.tavily_search import TavilySearchResults
from langgraph.prebuilt import create_react_agent

llm = ChatGoogleGenerativeAI(model="gemma-4-31b-it", temperature=0)
search = TavilySearchResults(max_results=4)
agent = create_react_agent(llm, [search])
response = agent.invoke({"messages": [("human", prompt)]})
```

- Multi-turn ReAct loop: model decides when to search and when to answer
- Tavily search tool returns up to 4 results per query
- Agent history includes tool call messages (used to extract source URLs)

### Pattern 4: LangChain Structured Output (Supplier Research)

```python
extractor = llm.with_structured_output(QualityProperties)
quality = extractor.invoke(extraction_prompt)
```

- Uses LangChain's `.with_structured_output()` for Pydantic model extraction
- Applied after free-form research to normalize findings into structured data

## Rate Limiting & Retry

### Layer 1
- Exponential backoff on 429 errors
- Default: 3 retries, 2x delay multiplication
- Configurable via `max_retries` and `retry_delay`

### Layer 2
- No explicit retry (Gemini calls are optional; returns `None` on failure)
- Graceful degradation: system works without Gemini enhancement

### Supplier Research
- Proactive delay: 10 seconds between Gemini calls
- Retry with backoff: parses `retry in Xs` from error message + 5s buffer
- Max 3 retries with exponential backoff (`_RATE_LIMIT_DELAY * 2^attempt`)

## Prompt Engineering

### Layer 1 System Prompt
- Defined in `src/requirement_layer/prompts.py`
- Instructs model to use Google Search to find industry standards
- Specifies output format: JSON array of requirement rules

### Layer 2 Prompts (`src/competitor_layer/prompts.py`)

Three prompt templates:
1. **SYNONYM_EXPANSION_PROMPT**: Given ingredient name, aliases, and category, generate additional names and supplier search queries
2. **SUPPLIER_REASONING_PROMPT**: Given supplier evidence signals, generate 1-2 sentence assessment
3. **SUPPLIER_CLASSIFICATION_PROMPT**: Given search results from a domain, classify as manufacturer/distributor/reseller/unknown

### Supplier Research Prompt
- Inline in `graph.py: research_supplier()`
- 8 specific search query suggestions per supplier
- Asks for: product pages, TDS, COA, SDS, certifications, purity, grade, form

### Verification Extraction Prompt
- Built dynamically in `verify.py: _build_extraction_prompt()`
- Budget-constrained: ~8K chars of source text, PDFs prioritized
- Asks for every quality field with source_confidence rating
- Explicit JSON output format with example

## Error Handling

All LLM integrations handle failures gracefully:
- **Layer 1**: `SystemExit` / exceptions caught, error JSON returned
- **Layer 2**: Gemini calls return `None` on failure; pipeline continues without enhancement
- **Supplier Research**: Retry on 429, skip supplier on persistent failure
- **JSON parsing**: All responses have fallback when LLM returns non-JSON
