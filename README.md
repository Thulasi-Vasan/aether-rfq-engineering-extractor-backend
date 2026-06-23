# Aether RFQ — Machining Operation Extractor (backend)

A FastAPI service that takes a **2D engineering drawing (PDF)** + a **3D STEP file**
and uses an LLM on **AWS Bedrock (via boto3)** to infer the ordered list of
**machining operations** for an RFQ estimation — modelled on page 3 of the
Meridian RFQ machining table.

The LLM produces only the *interpreted* fields — **operation number, description,
reasoning**. The remaining cost/cycle-time columns are filled with **mock**
values (flagged `is_mock`) for the frontend table until real cost inputs are
wired in.

## How it works

```
PDF drawing ─┐
             ├─► Bedrock Converse (boto3)  ──► forced tool  ──► validated ops
STEP file ───┘        ▲                       record_machining_operations
   │                  │
   └─ pythonOCC ──► feature summary (bbox, volume, weight, bore radii, face types)
                                                              │
                                            mock cost columns ┴─► JSON for frontend
```

- **PDF** is sent as a Converse `document` block so the model *sees* the drawing.
- **STEP** is summarised with **pythonOCC** (bounding box, volume → weight,
  cylindrical/planar/conical/freeform face counts, bore-radius histogram) — high
  signal, low token count. Raw STEP (~57k lines) is never sent to the model.
- A single **forced tool** yields schema-validated structured output.

## Requirements / environment

pythonOCC (`pythonocc-core`) is **conda-only**, so the app runs inside the
`cad-occ` conda env. Dependencies are declared in `pyproject.toml` and managed
with **uv** — installed *into* the conda env (uv handles everything except
pythonOCC, which conda already provides):

```bash
# install project + deps into the cad-occ env
uv pip install --python "$(conda run -n cad-occ which python)" -e .
```

## Configuration

Copy `.env.example` → `.env` and set values. The most important one:

- `BEDROCK_MODEL_ID` — **confirm this matches a model enabled in your Bedrock
  account & region** (Bedrock console → Model access). Bedrock IDs are
  prefixed / inference-profile style and differ from first-party Anthropic IDs.
  Default is Sonnet; override anytime.

AWS credentials use the standard chain (env vars / shared config / instance
role). Optionally set `AWS_PROFILE`.

## Run

```bash
conda run -n cad-occ uvicorn app.main:app --reload
```

- Health: `GET /health`
- Extract: `POST /api/v1/extract-operations` (multipart: `drawing_pdf`, `step_file`)
- Interactive docs: `http://localhost:8000/docs`

Example:

```bash
curl -s -X POST http://localhost:8000/api/v1/extract-operations \
  -F "drawing_pdf=@docs/6511292_Rev_4.pdf" \
  -F "step_file=@docs/6511292.stp" | jq
```

## Layout

```
app/
  main.py              FastAPI app + /api/v1/extract-operations
  config.py            env-driven settings
  schemas.py           Pydantic models (LLM output + full table row + response)
  agent/
    bedrock_client.py  boto3 bedrock-runtime client
    extractor.py       Converse call + parse + assemble response
    tool_schema.py     forced-tool JSON schema (structured output)
    step_parser.py     pythonOCC STEP -> feature summary  (pluggable)
    prompts.py         SYSTEM_PROMPT  (PLACEHOLDER — owned elsewhere)
    enrichment.py      mock cost/cycle columns  (replace with cost master)
```

## Extension points

- **System prompt** — `app/agent/prompts.py` is a placeholder; drop in the real
  prompt with no other changes.
- **STEP features** — `step_parser.summarize_step()` is isolated; swap for a
  deeper feature recognizer later.
- **Cost columns** — `enrichment.enrich_operations()` returns mock values today;
  replace with a real cost-master lookup.
```
