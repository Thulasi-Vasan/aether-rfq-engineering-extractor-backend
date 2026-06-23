"""Fill the non-LLM table columns with MOCK / placeholder values.

The LLM only produces opn_no + description + reasoning. The frontend table needs
the full set of columns (cycle time, machine cost, cells, amount) so it renders
like the reference Meridian sheet. Until the real cost inputs are wired in, we
populate those columns with deterministic placeholder values and flag them via
`is_mock=True`.

Replace `enrich_operations()` with a real cost-master lookup when available.
"""
from ..schemas import LLMOperation, MachiningOperationRow

# Deterministic placeholder values, cycled by operation index. Loosely modelled
# on the reference sheet so the UI looks realistic — NOT real estimates.
_MOCK_CYCLE_TIMES = [7.0, 5.9, 5.0, 7.0, 2.0, 2.0, 2.0, 2.0, 2.0, 0.0]
_MOCK_MACHINE_COSTS = [
    4_000_000, 4_000_000, 4_000_000, 8_900_000, 3_600_000,
    1_800_000, 2_400_000, 200_000, 800_000, 0,
]


def enrich_operations(operations: list[LLMOperation]) -> list[MachiningOperationRow]:
    rows: list[MachiningOperationRow] = []
    for idx, op in enumerate(operations):
        cycle = _MOCK_CYCLE_TIMES[idx % len(_MOCK_CYCLE_TIMES)]
        cost = _MOCK_MACHINE_COSTS[idx % len(_MOCK_MACHINE_COSTS)]
        cells = 1
        rows.append(
            MachiningOperationRow(
                opn_no=op.opn_no,
                description=op.description,
                reasoning=op.reasoning,
                cycle_time_min=cycle,
                no_of_machines_per_cell=1,
                machine_cost_rs=cost,
                no_of_cells=cells,
                amount_rs=cost * cells,
                is_mock=True,
            )
        )
    return rows


def mock_cell_cycle_time(rows: list[MachiningOperationRow]) -> float:
    """MOCK: largest cycle time across operations (cell is gated by slowest op)."""
    return max((r.cycle_time_min for r in rows), default=0.0)


def mock_total_capex(rows: list[MachiningOperationRow]) -> int:
    """MOCK: sum of placeholder amounts."""
    return sum(r.amount_rs for r in rows)
