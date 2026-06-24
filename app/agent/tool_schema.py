"""JSON schema for the forced Bedrock Converse tool.

Forcing a single tool (`toolChoice = {tool: ...}`) is how we get reliable,
schema-validated structured output out of the model. The schema mirrors the
process-plan structure the system prompt produces: a part overview, an ordered
list of richly-described operations, and an overall sequence justification.

Design notes:
  - Overview fields are nullable so the model never hallucinates to fill an
    unreadable title-block field — it leaves it null and records why in
    `assumptions_or_gaps`.
  - `source_of_truth` is STRUCTURED (a list of evidence items) so the frontend
    can render and a reviewer can verify each drawing citation.
  - `plain_summary` is a one-sentence, jargon-free explanation; the technical
    detail lives in `what_we_do` / `why_this_operation`.
  - The drawing is the sole source of truth for operation decisions; the STEP
    summary supports geometry understanding only and must never be cited as
    drawing evidence (enforced in the prompt, restated here for the model).
"""

TOOL_NAME = "record_machining_operations"

_EVIDENCE_ITEM = {
    "type": "object",
    "description": "A single piece of drawing evidence justifying the operation.",
    "properties": {
        "evidence_text": {
            "type": "string",
            "description": (
                "The exact drawing evidence, e.g. 'Ø124.55-124.60' or "
                "'NOTE: Slot into volute shall be completed prior to finish machining'."
            ),
        },
        "evidence_type": {
            "type": "string",
            "enum": ["dimension", "note", "spec", "datum", "classification", "view_ref"],
            "description": "What kind of drawing evidence this is.",
        },
        "sheet": {
            "type": ["string", "null"],
            "description": "Sheet the evidence appears on, e.g. 'Sheet 1'. Null if unknown.",
        },
        "view_or_detail": {
            "type": ["string", "null"],
            "description": "View/detail reference, e.g. 'Section X-X', 'Detail AB 2:1'. Null if N/A.",
        },
    },
    "required": ["evidence_text", "evidence_type"],
}

_PART_OVERVIEW = {
    "type": "object",
    "description": "High-level overview of the part, read from the drawing title block / notes.",
    "properties": {
        "part_name": {"type": ["string", "null"], "description": "Part name from the title block."},
        "part_number": {"type": ["string", "null"], "description": "Part number from the title block."},
        "revision": {"type": ["string", "null"], "description": "Drawing revision."},
        "input_blank": {
            "type": ["string", "null"],
            "description": "Input blank type (casting vs semi-finished), from Item Identifier / BOM.",
        },
        "material": {
            "type": ["string", "null"],
            "description": "Material, from the Associated Specifications.",
        },
        "drawing_standard": {
            "type": ["string", "null"],
            "description": "Governing drawing standard from the title block, e.g. 'ASME Y14.5-2009'.",
        },
        "most_critical_dimension": {
            "type": ["string", "null"],
            "description": "The single most critical dimension on the drawing (value + tolerance).",
        },
        "most_critical_dimension_reason": {
            "type": ["string", "null"],
            "description": "Why that dimension matters functionally on the turbocharger.",
        },
        "assumptions_or_gaps": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Anything that could not be read from the drawing, or assumptions made.",
        },
    },
    "required": [
        "part_name",
        "part_number",
        "revision",
        "input_blank",
        "material",
        "drawing_standard",
        "most_critical_dimension",
        "most_critical_dimension_reason",
        "assumptions_or_gaps",
    ],
}

_OPERATION = {
    "type": "object",
    "properties": {
        "opn_no": {
            "type": "integer",
            "description": "Operation number in process order (e.g. 20, 30, 40 ...).",
        },
        "operation_name": {
            "type": "string",
            "description": "Short operation name, e.g. 'Finish bore inducer (Datum C)'.",
        },
        "plain_summary": {
            "type": "string",
            "description": (
                "ONE plain-language sentence a non-specialist understands. No unexplained jargon."
            ),
        },
        "what_we_do": {
            "type": "string",
            "description": (
                "1-2 sentences: the physical action — machine, surfaces cut, and to what "
                "state (rough/finish/final)."
            ),
        },
        "why_this_operation": {
            "type": "string",
            "description": (
                "2-3 sentences: why this operation type, why at this point in the sequence, "
                "and the functional consequence of getting it wrong."
            ),
        },
        "source_of_truth": {
            "type": "array",
            "description": (
                "Drawing evidence ONLY (never STEP geometry) that justifies this operation."
            ),
            "items": _EVIDENCE_ITEM,
        },
        "machine_type": {
            "type": "string",
            "description": "Machine type, e.g. 'CNC Turning Center', 'VMC'.",
        },
        "key_tooling": {
            "type": "string",
            "description": "Key tooling, e.g. 'PCD boring bar', 'carbide face mill'.",
        },
        "tool_choice_reason": {
            "type": "string",
            "description": (
                "Why this tooling — connect tool material/geometry to the workpiece "
                "(AlSiCu, silicon abrasiveness) and the feature's tolerance band."
            ),
        },
        "assumptions_or_gaps": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Anything unclear on the drawing for this operation, or assumptions made.",
        },
    },
    "required": [
        "opn_no",
        "operation_name",
        "plain_summary",
        "what_we_do",
        "why_this_operation",
        "source_of_truth",
        "machine_type",
        "key_tooling",
        "tool_choice_reason",
    ],
}

TOOL_SPEC = {
    "toolSpec": {
        "name": TOOL_NAME,
        "description": (
            "Record the complete machining process plan interpreted from the 2D "
            "engineering drawing (sole source of truth) and supported by the 3D STEP "
            "geometry summary. Operations must be in process order (lowest number first)."
        ),
        "inputSchema": {
            "json": {
                "type": "object",
                "properties": {
                    "part_overview": _PART_OVERVIEW,
                    "operations": {
                        "type": "array",
                        "description": "Ordered machining operations.",
                        "items": _OPERATION,
                    },
                    "sequence_justification": {
                        "type": "string",
                        "description": (
                            "5-8 sentences explaining the overall logic of the operation order: "
                            "datum establishment, roughing before finishing, holes/slots after "
                            "precision bores, and any explicit drawing sequencing constraints."
                        ),
                    },
                },
                "required": ["part_overview", "operations", "sequence_justification"],
            }
        },
    }
}

TOOL_CONFIG = {
    "tools": [TOOL_SPEC],
    "toolChoice": {"tool": {"name": TOOL_NAME}},
}
