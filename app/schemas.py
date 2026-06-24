"""Pydantic models for the extractor API.

The schema mirrors the process-plan structure the system prompt produces:

    Part Overview  ->  Operation List (rich, per-operation)  ->  Sequence Justification

The LLM produces all of the interpreted content (overview, per-operation
breakdown, structured drawing evidence, sequence justification). Every numeric
cost/time column is filled downstream with MOCK values (see enrichment.py) until
the real cost inputs are available — `is_mock` flags those for the frontend.
"""
from typing import Literal

from pydantic import BaseModel, Field

EvidenceType = Literal["dimension", "note", "spec", "datum", "classification", "view_ref"]


class DrawingEvidence(BaseModel):
    """A single structured piece of drawing evidence justifying an operation."""

    evidence_text: str = Field(..., description="The exact drawing evidence (value, note, callout).")
    evidence_type: EvidenceType = Field(..., description="Kind of evidence.")
    sheet: str | None = Field(None, description="Sheet the evidence appears on, e.g. 'Sheet 1'.")
    view_or_detail: str | None = Field(None, description="View/detail ref, e.g. 'Section X-X'.")


class PartOverview(BaseModel):
    """High-level part overview read from the drawing. Fields nullable to avoid
    hallucination when a title-block field is not readable."""

    part_name: str | None = None
    part_number: str | None = None
    revision: str | None = None
    input_blank: str | None = Field(None, description="Casting vs semi-finished, from Item Identifier/BOM.")
    material: str | None = Field(None, description="From the Associated Specifications.")
    drawing_standard: str | None = Field(None, description="From the title block, e.g. 'ASME Y14.5-2009'.")
    most_critical_dimension: str | None = None
    most_critical_dimension_reason: str | None = None
    assumptions_or_gaps: list[str] = Field(default_factory=list)


class LLMOperation(BaseModel):
    """A single operation as inferred by the LLM (the structured tool output)."""

    opn_no: int = Field(..., description="Operation number, e.g. 20, 30, 40 ...")
    operation_name: str = Field(..., description="Short operation name.")
    plain_summary: str = Field(..., description="One plain-language sentence, no unexplained jargon.")
    what_we_do: str = Field(..., description="Physical action: machine, surfaces, state.")
    why_this_operation: str = Field(..., description="Type choice + sequence logic + failure consequence.")
    source_of_truth: list[DrawingEvidence] = Field(
        default_factory=list, description="Structured drawing evidence (never STEP geometry)."
    )
    machine_type: str = Field(..., description="Machine type, e.g. 'CNC Turning Center'.")
    key_tooling: str = Field(..., description="Key tooling, e.g. 'PCD boring bar'.")
    tool_choice_reason: str = Field(..., description="Tool choice tied to material + tolerance band.")
    assumptions_or_gaps: list[str] = Field(default_factory=list)


class LLMResult(BaseModel):
    """Full structured payload returned by the forced Bedrock tool call."""

    part_overview: PartOverview = Field(default_factory=PartOverview)
    operations: list[LLMOperation] = Field(default_factory=list)
    sequence_justification: str | None = None


class MachiningOperationRow(BaseModel):
    """A full table row as shown in the frontend: LLM fields + mock cost columns."""

    # --- LLM-derived ---
    opn_no: int
    operation_name: str
    plain_summary: str
    what_we_do: str
    why_this_operation: str
    source_of_truth: list[DrawingEvidence] = Field(default_factory=list)
    machine_type: str
    key_tooling: str
    tool_choice_reason: str
    assumptions_or_gaps: list[str] = Field(default_factory=list)
    # --- mock / placeholder columns (pending real cost inputs) ---
    cycle_time_min: float
    no_of_machines_per_cell: int
    machine_cost_rs: int
    no_of_cells: int
    amount_rs: int
    is_mock: bool = Field(True, description="True while the numeric columns are placeholder values")


class StepFeatureSummary(BaseModel):
    """Lightweight 3D feature summary extracted from the STEP file via pythonOCC."""

    bounding_box_mm: list[float]
    volume_mm3: float
    estimated_weight_kg: float
    num_solids: int
    num_faces: int
    num_cylindrical_faces: int
    num_planar_faces: int
    num_conical_faces: int
    num_freeform_faces: int
    cylinder_radius_histogram_mm: dict[str, int] = Field(default_factory=dict)


class ExtractionResponse(BaseModel):
    """Top-level response consumed by the frontend table view."""

    part_overview: PartOverview | None = None
    part_number: str | None = None
    model_id: str
    operations: list[MachiningOperationRow]
    sequence_justification: str | None = None
    cell_cycle_time_min: float = Field(0.0, description="MOCK summary value")
    total_capex_rs: int = Field(0, description="MOCK summary value")
    step_features: StepFeatureSummary | None = None
    notes: str = (
        "Cost / cycle-time columns are placeholder (mock) values pending additional "
        "inputs. Only the process-plan content (overview, operations, sequence) is LLM-derived."
    )
