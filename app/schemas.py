"""Pydantic models for the extractor API.

The machining operations table on page 3 of the Meridian RFQ PDF is the
reference for this schema. Columns:

    Opn. No. | Description | Cycle Time | No of m/cs/cell | Machine Cost | No. of Cells | Amount

The LLM only produces the *interpreted* fields (opn_no, description, reasoning).
Every numeric cost/time column is filled downstream with MOCK values (see
enrichment.py) until the real cost inputs are available — `is_mock` flags those
for the frontend.
"""
from pydantic import BaseModel, Field


class LLMOperation(BaseModel):
    """A single operation as inferred by the LLM (the structured tool output)."""

    opn_no: int = Field(..., description="Operation number, e.g. 20, 30, 40 ...")
    description: str = Field(..., description="Operation / machine description")
    reasoning: str = Field(..., description="Why this operation, derived from drawing + STEP features")


class LLMResult(BaseModel):
    """Full structured payload returned by the forced Bedrock tool call."""

    part_number: str | None = Field(None, description="Part number read from the drawing")
    operations: list[LLMOperation] = Field(default_factory=list)


class MachiningOperationRow(BaseModel):
    """A full table row as shown in the frontend: LLM fields + mock cost columns."""

    # --- LLM-derived ---
    opn_no: int
    description: str
    reasoning: str
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

    part_number: str | None = None
    model_id: str
    operations: list[MachiningOperationRow]
    cell_cycle_time_min: float = Field(0.0, description="MOCK summary value")
    total_capex_rs: int = Field(0, description="MOCK summary value")
    step_features: StepFeatureSummary | None = None
    notes: str = (
        "Cost / cycle-time columns are placeholder (mock) values pending additional "
        "inputs. Only operation number, description and reasoning are LLM-derived."
    )
