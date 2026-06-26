"""Fixed machine / work-center inventory.

The LLM must select `machine_type` from this list when it is populated. This is
the single source of truth for machine names used by the tool schema, prompt,
and backend validation.
"""

MACHINE_INVENTORY: list[str] = [
    # Turning centers
    "TURNING CENTER- Diffuser & Inlet M/cng (LT-20)",
    "TURNING CENTER- Outlet M/cng- SMALL, MEDIUM (LT-20)",
    "TURNING CENTER- Diffuser & Inlet M/cng (with chuck)",
    # VMC / machining centers
    "VMC 450 & 5th AXIS - WTH ROTARY TABLE, XYZ600x450x500, TS-900 X 450",
    "Fanuc robo drill Alpha-D21LiB Plus - X-700x400x330 GPL 150 to 480 Table 850x410 Rpm 10000 Rapid 482/min (21tools) tool",
    "MCV 650 -XYZ -1200/650/960, Table size 1200x650,Rapid,32/32/24,Rpm std 6000 / opt12000 Tools-24/30/40 M/c-",
    "VMC 450 & 4th AXIS - XYZ-600x450x500, TS-900 X 450",
    "BFW- Orion-H6600-4 th Axis -X/Y/Z-1000x1000x1000, Table 20 Size - 630x630,Chip to chip -4.2, tool to tool -2.0",
    "VMC 700 & 4th AXIS - XYZ-1500x700x700, TS-1650 X 700 , BT-40, Spindle Speed 5K (Opt-8)Rapid-20/20/20m/min)",
    "VMC 450 & 4th AXIS - XYZ-800x450x500, TS-1000 X 450 , BT-40, Spindle Speed 6K (Opt-10K)Rapid-36m/min )",
    # Specialist machines
    "DEEP HOLE DRILLING MACHINE, LENGTH ABOVE 300 MM",
    # Post-machining stations
    "DRY CUM WET LEAK TEST",
    "COORDINATE MEASURING MACHING (CMM)",
    "FINAL INSPECTION",
    "ENDOSCOPE STATION",
    # Washing / cleaning
    "WASHING MACHINE - SMALL, BELOW 250 MM",
    "WASHING MACHINE - MEDIUM, BTW. 250 TO 500 MM",
    "WASHING MACHINE - LARGE, ABOVE 500 MM",
    "ULTRASONIC CLEANING EQUIPMENT",
    # Marking
    "LASER MARKING USING 2D SCANNER",
    "INKJET MARKING",
    "CHEMICAL ETCHING/ ELECTROCHEMICAL MARKING",
]


def inventory_as_prompt_block() -> str:
    """Render the inventory as a bullet list for the system prompt."""
    return "\n".join(f"- {name}" for name in MACHINE_INVENTORY)
