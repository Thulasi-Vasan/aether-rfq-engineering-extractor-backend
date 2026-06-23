export interface MachiningOperation {
  opn_no: number;
  description: string;
  reasoning: string;
  cycle_time_min: number;
  no_of_machines_per_cell: number;
  machine_cost_rs: number;
  no_of_cells: number;
  amount_rs: number;
  is_mock: boolean;
}

export interface StepFeatures {
  bounding_box_mm: [number, number, number];
  volume_mm3: number;
  estimated_weight_kg: number;
  num_solids: number;
  num_faces: number;
  num_cylindrical_faces: number;
  num_planar_faces: number;
  num_conical_faces: number;
  num_freeform_faces: number;
  cylinder_radius_histogram_mm: Record<string, number>;
}

export interface ExtractResponse {
  part_number: string;
  model_id: string;
  operations: MachiningOperation[];
  cell_cycle_time_min: number;
  total_capex_rs: number;
  step_features: StepFeatures;
  notes: string;
}

export type AppState = "upload" | "processing" | "results";
