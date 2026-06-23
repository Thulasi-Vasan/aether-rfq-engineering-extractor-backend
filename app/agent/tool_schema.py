"""JSON schema for the forced Bedrock Converse tool.

Forcing a single tool (`toolChoice = {tool: ...}`) is how we get reliable,
schema-validated structured output out of the model. The schema deliberately
only asks the LLM for the *interpreted* fields — operation number, description,
and reasoning — mirroring the Meridian machining table columns it can actually
infer from the drawing + STEP geometry.
"""

TOOL_NAME = "record_machining_operations"

TOOL_SPEC = {
    "toolSpec": {
        "name": TOOL_NAME,
        "description": (
            "Record the ordered list of machining operations interpreted from the "
            "2D engineering drawing and the 3D STEP geometry. Operations must be in "
            "process order (lowest operation number first)."
        ),
        "inputSchema": {
            "json": {
                "type": "object",
                "properties": {
                    "part_number": {
                        "type": "string",
                        "description": "Part number read from the drawing title block, if visible.",
                    },
                    "operations": {
                        "type": "array",
                        "description": "Ordered machining operations.",
                        "items": {
                            "type": "object",
                            "properties": {
                                "opn_no": {
                                    "type": "integer",
                                    "description": "Operation number (e.g. 20, 30, 40 ...).",
                                },
                                "description": {
                                    "type": "string",
                                    "description": (
                                        "Operation / machine description, e.g. "
                                        "'TURNING CENTER - Diffuser & Inlet M/cng'."
                                    ),
                                },
                                "reasoning": {
                                    "type": "string",
                                    "description": (
                                        "Concise justification grounded in specific drawing "
                                        "callouts and/or STEP features."
                                    ),
                                },
                            },
                            "required": ["opn_no", "description", "reasoning"],
                        },
                    },
                },
                "required": ["operations"],
            }
        },
    }
}

TOOL_CONFIG = {
    "tools": [TOOL_SPEC],
    "toolChoice": {"tool": {"name": TOOL_NAME}},
}
