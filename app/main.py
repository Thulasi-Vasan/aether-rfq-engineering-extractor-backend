"""FastAPI app exposing the machining-operation extractor.

Run from the `cad-occ` conda env (pythonOCC is conda-only):

    conda run -n cad-occ uvicorn app.main:app --reload
"""
from __future__ import annotations

import logging
import os
import tempfile

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .agent.extractor import ExtractionError, extract_operations
from .config import get_settings
from .schemas import ExtractionResponse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%H:%M:%S",
)

settings = get_settings()
app = FastAPI(title=settings.api_title, version=settings.api_version)
log = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "model_id": settings.bedrock_model_id, "region": settings.aws_region}


@app.post("/api/v1/extract-operations", response_model=ExtractionResponse)
async def extract(
    drawing_pdf: UploadFile = File(..., description="2D engineering drawing (PDF)"),
    step_file: UploadFile = File(..., description="3D model (STEP/.stp/.step)"),
) -> ExtractionResponse:
    log.info("Request: pdf=%s  step=%s", drawing_pdf.filename, step_file.filename)
    pdf_bytes = await drawing_pdf.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Empty drawing_pdf upload.")

    step_bytes = await step_file.read()
    if not step_bytes:
        raise HTTPException(status_code=400, detail="Empty step_file upload.")

    # pythonOCC reads from a path, so persist the STEP upload to a temp file.
    suffix = os.path.splitext(step_file.filename or "")[1] or ".stp"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(step_bytes)
            tmp_path = tmp.name
        return extract_operations(pdf_bytes, tmp_path)
    except ExtractionError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 - surface a clean error to the client
        raise HTTPException(status_code=500, detail=f"Extraction failed: {exc}") from exc
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
