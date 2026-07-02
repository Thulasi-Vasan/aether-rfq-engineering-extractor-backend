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
  component_category?: string;
  sheet: string | null;
  view_or_detail: string | null;
  verbatim_text: string | null;
  match_terms: string[];
  pdf_anchor: PdfAnchor | null;
}

export interface MachiningOperation {
  opn_no: number;
  operation_name: string;
  operation_narrative?: string;
  source_of_truth: SourceOfTruth[];
  cycle_time_min: number;
  no_of_machines_per_cell: number;
  machine_cost_rs: number;
  no_of_cells: number;
  amount_rs: number;
  is_mock: boolean;
}

export interface PartOverview {
  part_name: string | null;
  part_number: string | null;
  revision: string | null;
  input_blank: string | null;
  material: string | null;
  drawing_standard: string | null;
  most_critical_dimension?: string | null;
  most_critical_dimension_reason?: string | null;
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
  sequence_justification?: string;
  cell_cycle_time_min: number;
  total_capex_rs: number;
  step_features: StepFeatures;
  notes: string;
}

export type AppState = "upload" | "processing" | "results";
