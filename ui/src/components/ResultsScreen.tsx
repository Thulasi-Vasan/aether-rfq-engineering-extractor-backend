import { useState } from "react";
import { motion } from "framer-motion";
import {
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Clock,
  IndianRupee,
  Package,
  Weight,
  Info,
  Box,
  AlertTriangle,
} from "lucide-react";
import type { ExtractResponse, MachiningOperation } from "@/types";
import { formatINR, formatNumber } from "@/lib/utils";

interface Props {
  result: ExtractResponse;
  onReset: () => void;
}

export default function ResultsScreen({ result, onReset }: Props) {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#F8FAFC] px-4 py-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">
              Extraction Complete
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-navy-900">
              Part {result.part_number}
            </h1>
            <p className="text-sm text-text-secondary mt-1 font-mono">
              {result.model_id}
            </p>
          </div>
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg border border-border bg-white hover:bg-bg-surface text-sm font-semibold text-navy-700 transition-colors shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            New Analysis
          </button>
        </motion.div>

        {/* Mock data disclaimer */}
        {result.operations.some((o) => o.is_mock) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex items-start gap-3 px-4 py-3 rounded-xl border border-warning/30 bg-warning-bg text-sm text-warning"
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Note:</strong> Cost, cycle-time, and machine columns are
              placeholder values (mock). Only{" "}
              <em>Opn No, Description, and Reasoning</em> come from the AI
              model.
            </span>
          </motion.div>
        )}

        {/* Operations Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
          style={{ boxShadow: "0 4px 24px rgba(10,22,40,0.06)" }}
        >
          <div className="px-6 py-5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-navy-900">
                Machining Operations
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                {result.operations.length} operations extracted
              </p>
            </div>
            <MockLegend />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-bg-panel text-xs text-text-secondary uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold text-left w-20">
                    Opn No
                  </th>
                  <th className="px-4 py-3 font-semibold text-left min-w-[220px]">
                    Description
                  </th>
                  <th className="px-4 py-3 font-semibold text-left min-w-[180px]">
                    Reasoning
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">
                    <MockField label="Cycle Time (min)" />
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">
                    <MockField label="Machines/Cell" />
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">
                    <MockField label="Machine Cost (₹)" />
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">
                    <MockField label="No. of Cells" />
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">
                    <MockField label="Amount (₹)" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.operations.map((op) => (
                  <OperationRow key={op.opn_no} op={op} />
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-4">
            Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              icon={<Package className="w-5 h-5 text-accent-blue" />}
              label="Part Number"
              value={result.part_number}
              mono
            />
            <SummaryCard
              icon={<Clock className="w-5 h-5 text-accent-blue" />}
              label="Cell Cycle Time"
              value={`${formatNumber(result.cell_cycle_time_min)} min`}
              isMock
            />
            <SummaryCard
              icon={<IndianRupee className="w-5 h-5 text-accent-blue" />}
              label="Total Capex"
              value={formatINR(result.total_capex_rs)}
              isMock
            />
            <SummaryCard
              icon={<Weight className="w-5 h-5 text-accent-blue" />}
              label="Est. Weight"
              value={`${formatNumber(result.step_features.estimated_weight_kg, 3)} kg`}
            />
          </div>
        </motion.div>

        {/* STEP Features */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="bg-white rounded-2xl border border-border shadow-sm p-6"
          style={{ boxShadow: "0 4px 24px rgba(10,22,40,0.06)" }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Box className="w-4 h-4 text-navy-700" />
            <h2 className="text-sm font-semibold text-navy-900">
              STEP Geometry Features
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <GeometryItem
              label="Bounding Box"
              value={result.step_features.bounding_box_mm
                .map((v) => `${v.toFixed(1)}`)
                .join(" × ") + " mm"}
            />
            <GeometryItem
              label="Volume"
              value={`${formatNumber(result.step_features.volume_mm3, 0)} mm³`}
            />
            <GeometryItem
              label="Solids"
              value={result.step_features.num_solids}
            />
            <GeometryItem
              label="Total Faces"
              value={result.step_features.num_faces}
            />
            <GeometryItem
              label="Cylindrical Faces"
              value={result.step_features.num_cylindrical_faces}
            />
            <GeometryItem
              label="Planar Faces"
              value={result.step_features.num_planar_faces}
            />
            <GeometryItem
              label="Conical Faces"
              value={result.step_features.num_conical_faces}
            />
            <GeometryItem
              label="Freeform Faces"
              value={result.step_features.num_freeform_faces}
            />
          </div>
        </motion.div>

        {/* Notes */}
        {result.notes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-bg-surface text-xs text-text-secondary"
          >
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-text-muted" />
            <span>{result.notes}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function OperationRow({ op }: { op: MachiningOperation }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <tr className="hover:bg-bg-surface/50 transition-colors align-top">
      <td className="px-4 py-4">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-navy-800 text-white text-xs font-bold">
          {op.opn_no}
        </span>
      </td>
      <td className="px-4 py-4">
        <p className="text-navy-900 font-medium whitespace-normal leading-snug max-w-xs">
          {op.description}
        </p>
      </td>
      <td className="px-4 py-4 max-w-[220px]">
        <div>
          <p
            className={`text-text-secondary whitespace-normal leading-snug text-xs ${
              expanded ? "" : "line-clamp-2"
            }`}
          >
            {op.reasoning}
          </p>
          {op.reasoning.length > 100 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 flex items-center gap-0.5 text-xs text-accent-blue hover:underline"
            >
              {expanded ? (
                <>
                  Show less <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  Read more <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>
          )}
        </div>
      </td>
      <MockCell value={formatNumber(op.cycle_time_min)} isMock={op.is_mock} />
      <MockCell value={op.no_of_machines_per_cell} isMock={op.is_mock} />
      <MockCell value={formatINR(op.machine_cost_rs)} isMock={op.is_mock} />
      <MockCell value={op.no_of_cells} isMock={op.is_mock} />
      <MockCell value={formatINR(op.amount_rs)} isMock={op.is_mock} />
    </tr>
  );
}

function MockCell({
  value,
  isMock,
}: {
  value: string | number;
  isMock: boolean;
}) {
  return (
    <td className="px-4 py-4 text-right">
      {isMock ? (
        <span className="text-text-muted italic text-xs font-mono">
          {value}
        </span>
      ) : (
        <span className="text-navy-900 font-medium font-mono text-xs">
          {value}
        </span>
      )}
    </td>
  );
}

function MockField({ label }: { label: string }) {
  return (
    <span className="flex items-center justify-end gap-1">
      {label}
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-warning-bg text-warning border border-warning/20 normal-case tracking-normal">
        mock
      </span>
    </span>
  );
}

function MockLegend() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-text-muted">
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-warning-bg text-warning border border-warning/20">
        mock
      </span>
      = placeholder value
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  isMock,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  isMock?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 flex flex-col justify-between shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-medium text-text-secondary">{label}</h3>
        <div className="w-8 h-8 rounded-lg bg-bg-surface flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span
          className={`text-xl font-bold ${isMock ? "text-text-muted italic" : "text-navy-900"} ${mono ? "font-mono" : ""}`}
        >
          {value}
        </span>
        {isMock && (
          <span className="mb-0.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-warning-bg text-warning border border-warning/20">
            mock
          </span>
        )}
      </div>
    </div>
  );
}

function GeometryItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-sm font-semibold text-navy-900 font-mono">
        {value}
      </span>
    </div>
  );
}
