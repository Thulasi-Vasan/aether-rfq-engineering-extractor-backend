export type PdfBBox = [number, number, number, number];
export type PdfPageSize = [number, number];
export type MatchStatus = "matched" | "ambiguous" | "not_found" | string;

export interface PdfAnchorCandidate {
  anchor_text?: string;
  anchor_bbox: PdfBBox | null;
  region_bbox: PdfBBox | null;
}

export interface PdfAnchor {
  page: number | null;
  anchor_text?: string;
  anchor_bbox: PdfBBox | null;
  region_bbox: PdfBBox | null;
  page_size: PdfPageSize | null;
  match_status: MatchStatus;
  confidence: number | null;
  candidates: PdfAnchorCandidate[];
}

export interface SourceOfTruth {
  evidence_text: string;
  evidence_type: string;
  sheet: string;
  view_or_detail: string;
  verbatim_text: string;
  match_terms: string[];
  pdf_anchor: PdfAnchor | null;
}

export interface MachiningOperation {
  opn_no: number;
  operation_name: string;
  plain_summary: string;
  what_we_do: string;
  why_this_operation: string;
  source_of_truth: SourceOfTruth[];
  machine_type: string;
  key_tooling: string;
  tool_choice_reason: string;
  assumptions_or_gaps: string[];
  cycle_time_min: number;
  no_of_machines_per_cell: number;
  machine_cost_rs: number;
  no_of_cells: number;
  amount_rs: number;
  is_mock: boolean;
}

export interface PartOverview {
  part_name: string;
  part_number: string;
  revision: string;
  input_blank: string;
  material: string;
  drawing_standard: string;
  most_critical_dimension: string;
  most_critical_dimension_reason: string;
  assumptions_or_gaps: string[];
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
  part_overview: PartOverview;
  part_number: string;
  model_id: string;
  operations: MachiningOperation[];
  sequence_justification: string;
  cell_cycle_time_min: number;
  total_capex_rs: number;
  step_features: StepFeatures;
  notes: string;
}

export type AppState = "upload" | "processing" | "results";
