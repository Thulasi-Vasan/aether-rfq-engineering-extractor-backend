"""Core agent: drawing PDF + STEP -> structured machining operations via Bedrock.

Uses the boto3 Bedrock Converse API:
  - the Rev-4 drawing is passed as a `document` block so the model can SEE it,
  - the STEP feature summary is passed as text,
  - a single forced tool (`record_machining_operations`) yields schema-validated
    structured output.
"""
from __future__ import annotations

import json
import logging

from ..config import get_settings
from ..schemas import ExtractionResponse, LLMResult, StepFeatureSummary
from . import enrichment
from .bedrock_client import get_bedrock_client
from .prompts import SYSTEM_PROMPT
from .step_parser import summarize_step, summary_to_prompt_text
from .tool_schema import TOOL_CONFIG, TOOL_NAME

log = logging.getLogger(__name__)


class ExtractionError(RuntimeError):
    """Raised when the model does not return a usable tool call."""


def _extract_tool_input(response: dict) -> dict:
    """Pull the forced tool's JSON input out of a Converse response."""
    content = response.get("output", {}).get("message", {}).get("content", [])
    for block in content:
        tool_use = block.get("toolUse")
        if tool_use and tool_use.get("name") == TOOL_NAME:
            return tool_use.get("input", {})
    stop_reason = response.get("stopReason")
    raise ExtractionError(
        f"Model did not call {TOOL_NAME!r} (stopReason={stop_reason!r}). "
        f"Raw content: {json.dumps(content)[:500]}"
    )


def _call_bedrock(pdf_bytes: bytes, step_summary: StepFeatureSummary) -> dict:
    settings = get_settings()
    client = get_bedrock_client()

    user_text = (
        "Determine the ordered machining operations for this part.\n\n"
        + summary_to_prompt_text(step_summary)
        + "\nThe attached PDF is the 2D engineering drawing."
    )

    messages = [
        {
            "role": "user",
            "content": [
                {
                    "document": {
                        "format": "pdf",
                        # Converse document names: alphanumerics/space/hyphen only.
                        "name": "engineering drawing",
                        "source": {"bytes": pdf_bytes},
                    }
                },
                {"text": user_text},
            ],
        }
    ]

    log.info("Bedrock: calling model=%s  pdf=%d KB", settings.bedrock_model_id, len(pdf_bytes) // 1024)
    response = client.converse(
        modelId=settings.bedrock_model_id,
        system=[{"text": SYSTEM_PROMPT}],
        messages=messages,
        toolConfig=TOOL_CONFIG,
        inferenceConfig={"maxTokens": settings.bedrock_max_tokens},
    )
    usage = response.get("usage", {})
    log.info(
        "Bedrock: done  input_tokens=%s  output_tokens=%s  stop=%s",
        usage.get("inputTokens", "?"),
        usage.get("outputTokens", "?"),
        response.get("stopReason", "?"),
    )
    return response


def extract_operations(pdf_bytes: bytes, step_path: str) -> ExtractionResponse:
    """Run the full pipeline and return the frontend-ready response."""
    settings = get_settings()

    step_summary = summarize_step(step_path, settings.material_density_g_per_mm3)
    response = _call_bedrock(pdf_bytes, step_summary)

    tool_input = _extract_tool_input(response)
    llm_result = LLMResult.model_validate(tool_input)

    # Keep operations in process order regardless of model ordering.
    ops = sorted(llm_result.operations, key=lambda o: o.opn_no)
    part_number = llm_result.part_overview.part_number
    log.info("LLM: part_number=%r  operations=%d", part_number, len(ops))
    for op in ops:
        log.info("  opn %d — %s", op.opn_no, op.operation_name)
    rows = enrichment.enrich_operations(ops)

    return ExtractionResponse(
        part_overview=llm_result.part_overview,
        part_number=part_number,
        model_id=settings.bedrock_model_id,
        operations=rows,
        sequence_justification=llm_result.sequence_justification,
        cell_cycle_time_min=enrichment.mock_cell_cycle_time(rows),
        total_capex_rs=enrichment.mock_total_capex(rows),
        step_features=step_summary,
    )
