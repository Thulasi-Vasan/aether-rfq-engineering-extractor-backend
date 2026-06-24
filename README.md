# Aether RFQ — Machining Operation Extractor (backend)

A FastAPI service that takes a **2D engineering drawing (PDF)** + a **3D STEP file**
and uses an LLM on **AWS Bedrock (via boto3)** to infer the ordered list of
**machining operations** for an RFQ estimation.

The LLM produces the full **process-plan content** — a part overview, an ordered
list of richly-described operations (plain summary, what we do, why, structured
drawing evidence, machine & tooling), and an overall sequence justification. The
cost/cycle-time columns are filled with **mock** values (flagged `is_mock`) for
the frontend table until real cost inputs are wired in.

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

## Prerequisites

- [Miniforge / Conda](https://github.com/conda-forge/miniforge) — for pythonOCC
- [uv](https://docs.astral.sh/uv/) — for Python dependency management
- AWS account with Bedrock access and a Claude model enabled in your region

## Setup

### 1. Create the conda environment

```bash
conda create -n cad-occ python=3.11
conda activate cad-occ
conda install -c conda-forge pythonocc-core
```

### 2. Install Python dependencies

```bash
uv pip install --python "$(conda run -n cad-occ which python)" -e .
```

### 3. Configure environment

```bash
cp .env.example .env
```

Open `.env` and set:

- `BEDROCK_MODEL_ID` — inference profile ID from your AWS Bedrock console.
  Run the command below to find available models in your region:
  ```bash
  aws bedrock list-inference-profiles --region <your-region> \
    --query "inferenceProfileSummaries[?contains(inferenceProfileId, 'claude')].inferenceProfileId" \
    --output table
  ```
- `AWS_REGION` — your AWS region (e.g. `ap-south-1`)
- `AWS_PROFILE` — optional, if using a named AWS profile

AWS credentials use the standard chain (env vars / `~/.aws/credentials` / instance role).

## Run

```bash
$(conda run -n cad-occ which uvicorn) app.main:app --reload
```

- Health check: `GET http://localhost:8000/health`
- Extract operations: `POST http://localhost:8000/api/v1/extract-operations`
- Interactive docs: `http://localhost:8000/docs`

### Postman / curl

**Method:** `POST`  
**URL:** `http://localhost:8000/api/v1/extract-operations`  
**Body:** `form-data`

| Key | Type |
|---|---|
| `drawing_pdf` | File — 2D engineering drawing (PDF) |
| `step_file` | File — 3D model (STEP / .stp) |

```bash
curl -s -X POST http://localhost:8000/api/v1/extract-operations \
  -F "drawing_pdf=@/path/to/drawing.pdf" \
  -F "step_file=@/path/to/model.stp" | jq
```

### Response shape

See [`response-postman.json`](response-postman.json) for a full example. Top level:

```
part_overview            part metadata (name, number, revision, blank, material,
                         drawing standard, most critical dimension + why, gaps)
operations[]             ordered ops; each has:
  opn_no, operation_name
  plain_summary          one plain-language sentence (jargon-free)
  what_we_do             physical action
  why_this_operation     type choice + sequence logic + failure consequence
  source_of_truth[]      structured drawing evidence (text, type, sheet, view)
  machine_type, key_tooling, tool_choice_reason
  assumptions_or_gaps[]
  cycle_time_min, machine_cost_rs, amount_rs, ...   ← MOCK (is_mock: true)
sequence_justification   overall ordering logic
cell_cycle_time_min, total_capex_rs                 ← MOCK summary
step_features            pythonOCC geometry summary
```

Only the cost/time columns are mock; everything else is LLM-derived.

## Project layout

```
app/
  main.py              FastAPI app + /api/v1/extract-operations
  config.py            env-driven settings
  schemas.py           Pydantic models (LLM output + full table row + response)
  agent/
    bedrock_client.py  boto3 bedrock-runtime client
    extractor.py       Converse call + parse + assemble response
    tool_schema.py     forced-tool JSON schema (structured output)
    step_parser.py     pythonOCC STEP -> feature summary (pluggable)
    prompts.py         SYSTEM_PROMPT (owned by prompt author)
    enrichment.py      mock cost/cycle columns (replace with cost master)
```

## Extension points

- **System prompt** — `app/agent/prompts.py`; replace `SYSTEM_PROMPT` with no other changes needed.
- **STEP features** — `step_parser.summarize_step()` is isolated; swap for a deeper feature recognizer later.
- **Cost columns** — `enrichment.enrich_operations()` returns mock values; replace with a real cost-master lookup.
