import type { ExtractResponse } from "@/types";

export function getSampleExtractionResponse(): ExtractResponse {
  return {
    part_number: "MOCK-123",
    model_id: "claude-mock",
    cell_cycle_time_min: 15.5,
    total_capex_rs: 500000,
    notes: "This is a mock response because the original response.json was missing.",
    sequence_justification: "Mock sequence justification.",
    part_overview: {
      part_name: "Mock Part",
      part_number: "MOCK-123",
      revision: "A",
      input_blank: "Block",
      material: "Aluminum",
      drawing_standard: "ISO",
      most_critical_dimension: "10 +/- 0.01",
      most_critical_dimension_reason: "Tight tolerance required for assembly",
    },
    step_features: {
      bounding_box_mm: [100, 100, 50],
      volume_mm3: 500000,
      estimated_weight_kg: 1.35,
      num_solids: 1,
      num_faces: 12,
      num_cylindrical_faces: 4,
      num_planar_faces: 8,
      num_conical_faces: 0,
      num_freeform_faces: 0,
      cylinder_radius_histogram_mm: { "5.0": 4 },
    },
    operations: [
      {
        opn_no: 10,
        operation_name: "Face Milling",
        operation_narrative: "Mill top face to size. Create datum A. First operation.",
        cycle_time_min: 2.5,
        no_of_machines_per_cell: 1,
        machine_cost_rs: 200,
        no_of_cells: 1,
        amount_rs: 200,
        is_mock: true,
        source_of_truth: [],
      }
    ]
  };
}
