"""Fixed machine / work-center inventory.

The LLM must select `machine_type` from this list when it is populated. This is
the single source of truth for machine names used by the tool schema, prompt,
and backend validation.
"""

MACHINE_INVENTORY: list[str] = [
    #  paste the ~15 real machine names here, one string per line.
    # Example shape (replace with the real list):
    # "TURNING CENTER - Diffuser & Inlet M/cng (LT-20)",
    # "VMC 450 & 5th AXIS - WTH ROTARY TABLE, XYZ600x450x500, TS-900 X 450",
    # "WASHING MACHINE - SMALL, BELOW 250 MM",
    # "DRY CUM WET LEAK TEST",
    # "LASER MARKING USING 2D SCANNER",
    # "FINAL INSPECTION",
    # "ENDOSCOPE STATION",
]


def inventory_as_prompt_block() -> str:
    """Render the inventory as a bullet list for the system prompt."""
    return "\n".join(f"- {name}" for name in MACHINE_INVENTORY)
