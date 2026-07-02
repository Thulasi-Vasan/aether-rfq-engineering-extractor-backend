import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import * as pdfjsLib from "pdfjs-dist";
import {
  Box,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  Clock,
  FileSearch,
  IndianRupee,
  Info,
  Layers3,
  LocateFixed,
  Maximize2,
  Minus,
  Package,
  Plus,
  RotateCcw,
  ShieldAlert,
  X,
} from "lucide-react";
import type {
  ExtractResponse,
  MachiningOperation,
  PdfAnchorCandidate,
  PdfBBox,
  SourceOfTruth,
} from "@/types";
import { cn, formatINR, formatNumber } from "@/lib/utils";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url,
).toString();

interface Props {
  result: ExtractResponse;
  pdfUrl: string;
  onReset: () => void;
}

interface SelectedEvidence {
  evidence: SourceOfTruth;
  op: MachiningOperation;
  candidate?: PdfAnchorCandidate;
}

export default function ResultsScreen({ result, pdfUrl, onReset }: Props) {
  const [openOps, setOpenOps] = useState<Set<number>>(new Set());
  const [selectedEvidence, setSelectedEvidence] =
    useState<SelectedEvidence | null>(null);

  const hasCriticalDimension =
    Boolean(result.part_overview?.most_critical_dimension) ||
    Boolean(result.part_overview?.most_critical_dimension_reason);
  const hasSequenceJustification = Boolean(result.sequence_justification);

  const toggleOperation = (opnNo: number) => {
    setOpenOps((current) => {
      const next = new Set(current);
      if (next.has(opnNo)) next.delete(opnNo);
      else next.add(opnNo);
      return next;
    });
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#F8FAFC] px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
        >
          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-text-muted">
              Extraction Complete
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-navy-900 md:text-3xl">
              {result.part_overview?.part_name || "Machining Process Plan"}
            </h1>
            <p className="mt-1 truncate text-sm font-mono text-text-secondary">
              Part {result.part_overview?.part_number ?? result.part_number}
            </p>
          </div>
          <button
            onClick={onReset}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#12356D] bg-[#12356D] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0e2a56]"
          >
            <RotateCcw className="h-4 w-4" />
            New Analysis
          </button>
        </motion.header>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <Panel>
            <div className="mb-4 flex items-center gap-2">
              <Package className="h-4 w-4 text-navy-700" />
              <h2 className="text-sm font-semibold text-navy-900">
                Part Overview
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Fact label="Input Blank" value={result.part_overview?.input_blank} />
              <Fact label="Material" value={result.part_overview?.material} />
              <Fact label="Revision" value={result.part_overview?.revision} />
              <Fact
                label="Drawing Standard"
                value={result.part_overview?.drawing_standard}
              />
            </div>
            {hasCriticalDimension && (
              <div className="mt-5 rounded-lg border border-danger/20 bg-danger-bg/60 p-4">
                <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-danger">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Critical Dimension
                </p>
                {result.part_overview?.most_critical_dimension && (
                  <p className="text-sm font-semibold text-navy-900">
                    {result.part_overview?.most_critical_dimension}
                  </p>
                )}
                {result.part_overview?.most_critical_dimension_reason && (
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {result.part_overview?.most_critical_dimension_reason}
                  </p>
                )}
              </div>
            )}
          </Panel>

          <Panel>
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-navy-700" />
              <h2 className="text-sm font-semibold text-navy-900">
                Commercial Summary
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Operations" value={result.operations?.length ?? 0} />
              <Metric
                label="Cell Cycle"
                value={result.cell_cycle_time_min != null ? `${formatNumber(result.cell_cycle_time_min)} min` : "N/A"}
                mock
              />
              <Metric
                label="Total Capex"
                value={result.total_capex_rs != null ? formatINR(result.total_capex_rs) : "N/A"}
                mock
              />
              <Metric
                label="Est. Weight"
                value={result.step_features?.estimated_weight_kg != null ? `${formatNumber(result.step_features.estimated_weight_kg, 3)} kg` : "N/A"}
              />
            </div>
          </Panel>
        </section>

        {result.step_features && (
          <Panel>
            <div className="mb-4 flex items-center gap-2">
              <Box className="h-4 w-4 text-navy-700" />
              <h2 className="text-sm font-semibold text-navy-900">
                STEP Geometry Features
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <GeometryItem
                label="Bounding Box"
                value={
                  Array.isArray(result.step_features?.bounding_box_mm)
                    ? result.step_features.bounding_box_mm
                        .map((v) => Number(v).toFixed(1))
                        .join(" x ") + " mm"
                    : "N/A"
                }
              />
              <GeometryItem
                label="Volume"
                value={result.step_features?.volume_mm3 != null ? `${formatNumber(result.step_features.volume_mm3, 0)} mm3` : "N/A"}
              />
              <GeometryItem label="Solids" value={result.step_features?.num_solids ?? "N/A"} />
              <GeometryItem label="Faces" value={result.step_features?.num_faces ?? "N/A"} />
              <GeometryItem
                label="Cylindrical"
                value={result.step_features?.num_cylindrical_faces ?? "N/A"}
              />
              <GeometryItem
                label="Planar"
                value={result.step_features?.num_planar_faces ?? "N/A"}
              />
              <GeometryItem
                label="Conical"
                value={result.step_features?.num_conical_faces ?? "N/A"}
              />
              <GeometryItem
                label="Freeform"
                value={result.step_features?.num_freeform_faces ?? "N/A"}
              />
            </div>
          </Panel>
        )}

        {hasSequenceJustification && (
          <Panel>
            <div className="mb-3 flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-navy-700" />
              <h2 className="text-sm font-semibold text-navy-900">
                Sequence Justification
              </h2>
            </div>
            <p className="text-sm leading-6 text-text-secondary">
              {result.sequence_justification}
            </p>
          </Panel>
        )}

        <section className="space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-navy-900">
                Machining Process Steps
              </h2>
              <p className="text-xs text-text-muted">
                The following are the sequence of machining operations required to produce the compressor housing. Click on the source of truth to view the evidence.
              </p>
            </div>
          </div>

          {(result.operations || []).map((op, index) => (
            <OperationPanel
              key={op.opn_no ?? index}
              op={op}
              index={index}
              expanded={openOps.has(op.opn_no)}
              onToggle={() => toggleOperation(op.opn_no)}
              onEvidenceClick={(evidence, candidate) =>
                setSelectedEvidence({ evidence, op, candidate })
              }
            />
          ))}
        </section>

        <section>
          <Panel>
            <div className="mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-navy-700" />
              <h2 className="text-sm font-semibold text-navy-900">
                Notes
              </h2>
            </div>
            {result.notes ? (
              <p className="mb-4 text-sm leading-6 text-text-secondary">
                {result.notes}
              </p>
            ) : (
              <p className="text-sm text-text-muted">No notes returned.</p>
            )}
          </Panel>
        </section>
      </div>

      {selectedEvidence && (
        <EvidenceViewer
          selected={selectedEvidence}
          pdfUrl={pdfUrl}
          onClose={() => setSelectedEvidence(null)}
          onCandidateSelect={(candidate) =>
            setSelectedEvidence((current) =>
              current ? { ...current, candidate } : current,
            )
          }
        />
      )}
    </div>
  );
}

function OperationPanel({
  op,
  index,
  expanded,
  onToggle,
  onEvidenceClick,
}: {
  op: MachiningOperation;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onEvidenceClick: (
    evidence: SourceOfTruth,
    candidate?: PdfAnchorCandidate,
  ) => void;
}) {
  const narrative = op.operation_narrative ?? "No operation narrative provided.";

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.025, 0.2), duration: 0.25 }}
      className="overflow-hidden rounded-xl border border-border bg-white shadow-sm"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-4 sm:px-8 py-4 text-left transition-colors hover:bg-bg-surface/70"
      >
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-navy-800 text-xs font-bold text-white">
          {op.opn_no}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold text-navy-900">
            {op.operation_name}
          </span>
        </span>
        <span className="mt-1 text-text-muted">
          {expanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border">
          <div className="grid grid-cols-1 border-b border-border md:grid-cols-5">
            <OperationMetric
              label="Cycle Time"
              value={op.cycle_time_min != null ? `${formatNumber(op.cycle_time_min)} min` : "N/A"}
              mock={op.is_mock}
            />
            <OperationMetric
              label="Machines / Cell"
              value={op.no_of_machines_per_cell ?? "N/A"}
              mock={op.is_mock}
            />
            <OperationMetric
              label="Machine Cost"
              value={op.machine_cost_rs != null ? formatINR(op.machine_cost_rs) : "N/A"}
              mock={op.is_mock}
            />
            <OperationMetric
              label="Cells"
              value={op.no_of_cells ?? "N/A"}
              mock={op.is_mock}
            />
            <OperationMetric
              label="Amount"
              value={op.amount_rs != null ? formatINR(op.amount_rs) : "N/A"}
              mock={op.is_mock}
            />
          </div>
          <div className="divide-y divide-border px-4 sm:px-8 py-2">
            <OperationTextRow title="Operation Narrative" text={narrative} />
          </div>
          <div className="border-t border-border px-4 sm:px-8 py-5">
            <EvidenceList
              evidence={op.source_of_truth ?? []}
              onEvidenceClick={onEvidenceClick}
            />
          </div>
        </div>
      )}
    </motion.article>
  );
}

function OperationMetric({
  label,
  value,
  mock,
}: {
  label: string;
  value: string | number;
  mock?: boolean;
}) {
  return (
    <div className="border-b border-border px-4 py-4 first:pl-4 sm:first:pl-8 last:pr-4 sm:last:pr-8 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
          {label}
        </span>
        {mock && <MockBadge />}
      </div>
      <p className={cn("break-words font-bold leading-6 text-[#111111]", mock ? "text-base" : "text-xl")}>
        {value}
      </p>
    </div>
  );
}

  function OperationTextRow({ title, text }: { title: string; text: string }) {
    // Convert literal bullet characters or malformed dashes to standard markdown lists
    const markdownText = (text || "").replace(/^[ \t]*[•-][ \t]*/gm, "- ");

    return (
      <div className="grid grid-cols-[138px_minmax(0,1fr)] items-center gap-4 py-4 pr-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-6 sm:pr-8">
        <h3 className="min-w-0 break-words pt-0.5 text-xs font-bold uppercase leading-5 tracking-widest text-text-muted">
          {title}
        </h3>
        <div className="min-w-0 break-words text-sm leading-6 text-[#111111] text-justify [&>ul]:list-outside [&>ul]:ml-4 [&>ul]:list-disc [&>ul>li]:pl-1 [&>ul>li]:mb-4 marker:text-[#12356D]">
          <ReactMarkdown>{markdownText}</ReactMarkdown>
        </div>
      </div>
    );
  }

  function EvidenceList({
    evidence,
    onEvidenceClick,
  }: {
    evidence: SourceOfTruth[];
    onEvidenceClick: (
      evidence: SourceOfTruth,
      candidate?: PdfAnchorCandidate,
    ) => void;
  }) {
    if (evidence.length === 0) {
      return (
        <Notice icon={<CircleDashed className="h-4 w-4" />}>
          No drawing evidence was returned for this operation.
        </Notice>
      );
    }

    // Group by component_category or fallback to text heuristic
    const grouped = evidence.reduce((acc, item) => {
      let cat = item.component_category;
      if (!cat) {
        // Heuristic: take text before any digit or specific symbol
        const match = (item.evidence_text || "").match(/^([^\dØ]+)/);
        cat = match ? match[1].trim() : "General";
        // Clean up common trailing words or single letters
        if (cat.endsWith(" R")) cat = cat.slice(0, -2);
      }

      const category = cat || "General Component";
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, SourceOfTruth[]>);

    return (
      <div>
        <div className="mb-4 flex items-center gap-2">
          <FileSearch className="h-4 w-4 text-navy-700" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-900">
            Source of Truth
          </h3>
        </div>
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="grid grid-cols-[138px_minmax(0,1fr)] items-start gap-4 pr-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-6 sm:pr-8">
              <h4 className="min-w-0 break-words pl-6 pt-3 text-[11px] font-bold uppercase leading-5 tracking-widest text-[#12356D]">
                {category}
              </h4>
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {items.map((item, index) => {
                  const status = item.pdf_anchor?.match_status ?? "not_found";
                  return (
                    <button
                      key={`${item.evidence_text}-${index}`}
                      type="button"
                      onClick={() => onEvidenceClick(item)}
                      className="rounded-lg border border-border bg-white p-3 text-left transition hover:border-accent-blue hover:bg-accent-light/20"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <StatusPill status={status} />
                        {item.sheet && (
                          <span className="text-[11px] font-medium text-text-muted">
                            {item.sheet}
                          </span>
                        )}
                        {item.view_or_detail && (
                          <span className="text-[11px] font-medium text-text-muted">
                            {item.view_or_detail}
                          </span>
                        )}
                      </div>
                      <p className="line-clamp-2 text-sm font-medium leading-5 text-navy-900">
                        {item.evidence_text}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function EvidenceViewer({
    selected,
    pdfUrl,
    onClose,
    onCandidateSelect,
  }: {
    selected: SelectedEvidence;
    pdfUrl: string;
    onClose: () => void;
    onCandidateSelect: (candidate: PdfAnchorCandidate) => void;
  }) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pageWidth, setPageWidth] = useState(0);
    const [pageHeight, setPageHeight] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const anchor = selected.evidence.pdf_anchor;
    const pageNumber = anchor?.page ?? 1;
    const pageSize = anchor?.page_size;
    const activeAnchorBBox = selected.candidate?.anchor_bbox ?? anchor?.anchor_bbox;
    const activeRegionBBox = selected.candidate?.region_bbox ?? anchor?.region_bbox;
    const scale = pageSize && pageWidth > 0 ? pageWidth / pageSize[0] : 0;

    useEffect(() => {
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") onClose();
      };

      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    useEffect(() => {
      let disposed = false;

      async function renderPage() {
        setLoading(true);
        setError(null);
        try {
          const loadingTask = pdfjsLib.getDocument({ url: pdfUrl });
          const pdfDoc = await loadingTask.promise;
          if (disposed) return;

          const safePage = Math.min(Math.max(pageNumber, 1), pdfDoc.numPages);
          const page = await pdfDoc.getPage(safePage);
          const baseViewport = page.getViewport({ scale: 1 });
          const availableWidth = Math.max(360, window.innerWidth - 420);
          const targetWidth = Math.max(720, availableWidth) * zoom;
          const renderScale = targetWidth / baseViewport.width;
          const viewport = page.getViewport({ scale: renderScale });
          const canvas = canvasRef.current;
          const context = canvas?.getContext("2d");
          if (!canvas || !context || disposed) return;

          const outputScale = Math.max(window.devicePixelRatio || 1, 2);
          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;
          context.setTransform(outputScale, 0, 0, outputScale, 0, 0);
          setPageWidth(viewport.width);
          setPageHeight(viewport.height);

          const renderTask = page.render({ canvasContext: context, viewport });
          await renderTask.promise;
          if (!disposed) setLoading(false);
        } catch (err) {
          if (
            err instanceof Error &&
            (err.name === "RenderingCancelledException" ||
              err.message.includes("cancelled"))
          ) {
            return;
          }
          if (!disposed) {
            setError(err instanceof Error ? err.message : "Unable to render PDF.");
            setLoading(false);
          }
        }
      }

      renderPage();
      return () => {
        disposed = true;
      };
    }, [pdfUrl, pageNumber, zoom]);

    useEffect(() => {
      const scrollEl = scrollRef.current;
      const bbox = activeRegionBBox ?? activeAnchorBBox;
      if (!scrollEl || !bbox || scale <= 0) return;

      const [x0, top, x1, bottom] = bbox;
      const centerX = ((x0 + x1) / 2) * scale;
      const centerY = ((top + bottom) / 2) * scale;

      scrollEl.scrollTo({
        left: Math.max(0, centerX - scrollEl.clientWidth / 2),
        top: Math.max(0, centerY - scrollEl.clientHeight / 2),
        behavior: "smooth",
      });
    }, [activeAnchorBBox, activeRegionBBox, scale]);

    const updateZoom = (nextZoom: number) => {
      setZoom(Math.min(3, Math.max(0.75, nextZoom)));
    };

    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="flex h-full w-full flex-col overflow-hidden bg-white">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Drawing Evidence · Op {selected.op.opn_no}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-navy-900">
                {selected.op.operation_name}
              </h2>
              <p className="mt-1 line-clamp-2 text-sm text-text-secondary">
                {selected.evidence.evidence_text}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => updateZoom(zoom - 0.25)}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-semibold text-navy-700 transition hover:bg-bg-surface disabled:cursor-not-allowed disabled:text-text-muted"
                disabled={zoom <= 0.75}
              >
                <Minus className="h-4 w-4" />
                Zoom
              </button>
              <span className="inline-flex h-9 min-w-16 items-center justify-center rounded-lg border border-border bg-bg-surface px-3 font-mono text-xs font-semibold text-navy-900">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => updateZoom(zoom + 0.25)}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-semibold text-navy-700 transition hover:bg-bg-surface disabled:cursor-not-allowed disabled:text-text-muted"
                disabled={zoom >= 3}
              >
                <Plus className="h-4 w-4" />
                Zoom
              </button>
              <button
                type="button"
                onClick={() => updateZoom(1)}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-semibold text-navy-700 transition hover:bg-bg-surface"
              >
                <Maximize2 className="h-4 w-4" />
                Fit
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-white px-3 text-text-muted transition hover:bg-bg-surface hover:text-navy-900"
                aria-label="Close drawing evidence"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div ref={scrollRef} className="min-h-0 overflow-auto bg-bg-panel p-5">
              <div className="relative mx-auto w-fit overflow-hidden rounded-md border border-border bg-white shadow-sm">
                <canvas ref={canvasRef} />
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm font-medium text-text-secondary">
                    Rendering PDF page...
                  </div>
                )}
                {scale > 0 && activeRegionBBox && (
                  <HighlightBox
                    bbox={activeRegionBBox}
                    scale={scale}
                    type="region"
                  />
                )}
                {scale > 0 && activeAnchorBBox && (
                  <HighlightBox
                    bbox={activeAnchorBBox}
                    scale={scale}
                    type="anchor"
                  />
                )}
              </div>
              {!error && anchor?.match_status === "not_found" && (
                <p className="mx-auto mt-3 max-w-2xl rounded-lg border border-warning/30 bg-warning-bg px-3 py-2 text-sm text-warning">
                  No exact anchor was found. The referenced page is shown when a
                  page number is available.
                </p>
              )}
              {error && (
                <p className="mx-auto mt-3 max-w-2xl rounded-lg border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">
                  {error}
                </p>
              )}
            </div>

            <aside className="min-h-0 overflow-auto border-t border-border bg-white p-5 lg:border-l lg:border-t-0">
              <div className="mb-4 flex items-center justify-between gap-3">
                <StatusPill status={anchor?.match_status ?? "not_found"} />
                <span className="text-xs font-mono text-text-muted">
                  Page {pageNumber}
                </span>
              </div>
              <EvidenceDetail selected={selected} />
              {anchor?.match_status === "ambiguous" &&
                (anchor.candidates?.length ?? 0) > 0 && (
                  <div className="mt-5">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-navy-900">
                      Candidate Locations
                    </h3>
                    <div className="space-y-2">
                      {(anchor.candidates || []).map((candidate, index) => (
                        <button
                          type="button"
                          key={`${candidate.anchor_text}-${index}`}
                          onClick={() => onCandidateSelect(candidate)}
                          className={cn(
                            "w-full rounded-lg border p-3 text-left text-sm transition",
                            selected.candidate === candidate
                              ? "border-accent-blue bg-accent-light/35"
                              : "border-border hover:border-accent-blue hover:bg-bg-surface",
                          )}
                        >
                          <span className="font-semibold text-navy-900">
                            Candidate {index + 1}
                          </span>
                          {candidate.anchor_text && (
                            <span className="ml-2 font-mono text-xs text-text-muted">
                              {candidate.anchor_text}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </aside>
          </div>
        </div>
      </div>
    );
  }

  function HighlightBox({
    bbox,
    scale,
    type,
  }: {
    bbox: PdfBBox;
    scale: number;
    type: "region" | "anchor";
  }) {
    const [x0, top, x1, bottom] = bbox;
    const style = {
      left: (x0 * scale) - 2,
      top: (top * scale) - 2,
      width: ((x1 - x0) * scale) + 4,
      height: ((bottom - top) * scale) + 4,
    };

    return (
      <div
        className={cn(
          "pointer-events-none absolute z-10",
          type === "region"
            ? "border border-accent-blue/40 bg-accent-blue/15"
            : "border-2 border-yellow-400/60 bg-yellow-400/20 rounded-[2px]",
        )}
        style={style}
      />
    );
  }

  function EvidenceDetail({ selected }: { selected: SelectedEvidence }) {
    const anchor = selected.evidence.pdf_anchor;
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Evidence
          </p>
          <p className="mt-1 text-sm leading-5 text-navy-900">
            {selected.evidence.evidence_text}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <Fact label="Type" value={selected.evidence.evidence_type} compact />
          <Fact label="Sheet" value={selected.evidence.sheet} compact />
          <Fact label="View / Detail" value={selected.evidence.view_or_detail} compact />
          <Fact
            label="Confidence"
            value={
              anchor?.confidence == null
                ? "N/A"
                : `${Math.round(anchor.confidence * 100)}%`
            }
            compact
          />
        </div>
      </div>
    );
  }

  function StatusPill({ status }: { status: string }) {
    const config =
      status === "matched"
        ? {
          label: "matched",
          icon: <CheckCircle2 className="h-3 w-3" />,
          className: "border-success/25 bg-success-bg text-success",
        }
        : status === "ambiguous"
          ? {
            label: "ambiguous",
            icon: <LocateFixed className="h-3 w-3" />,
            className: "border-warning/25 bg-warning-bg text-warning",
          }
          : {
            label: "not found",
            icon: <CircleDashed className="h-3 w-3" />,
            className: "border-border bg-bg-surface text-text-secondary",
          };

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
          config.className,
        )}
      >
        {config.icon}
        {config.label}
      </span>
    );
  }

  function Panel({ children }: { children: React.ReactNode }) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-xl border border-border bg-white p-5 shadow-sm"
        style={{ boxShadow: "0 4px 24px rgba(10,22,40,0.06)" }}
      >
        {children}
      </motion.div>
    );
  }

  function Fact({
    label,
    value,
    compact,
  }: {
    label: string;
    value: string | number;
    compact?: boolean;
  }) {
    return (
      <div className={compact ? "" : "flex h-full flex-col justify-center rounded-lg border border-border bg-bg-surface p-3"}>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          {label}
        </p>
        <p className="break-words text-sm font-semibold text-navy-900">
          {value || "N/A"}
        </p>
      </div>
    );
  }

  function Metric({
    label,
    value,
    mock,
    strong,
  }: {
    label: string;
    value: string | number;
    mock?: boolean;
    strong?: boolean;
  }) {
    return (
      <div className="flex h-full flex-col justify-center rounded-lg border border-border bg-bg-surface p-3">
        <div className="mb-1 flex min-h-4 items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            {label}
          </p>
          {mock && <MockBadge />}
        </div>
        <p
          className={cn(
            "break-words text-sm font-semibold text-navy-900",
            strong && "text-base",
          )}
        >
          {value}
        </p>
      </div>
    );
  }

  function MockBadge() {
    return (
      <span className="rounded border border-warning/20 bg-warning-bg px-1.5 py-0.5 text-[10px] font-semibold text-warning">
        mock
      </span>
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
      <div className="flex h-full flex-col justify-center rounded-lg border border-border bg-bg-surface p-3">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          {label}
        </p>
        <p className="break-words text-sm font-semibold text-navy-900">
          {value}
        </p>
      </div>
    );
  }

  function Notice({
    children,
    icon,
    tone = "default",
  }: {
    children: React.ReactNode;
    icon: React.ReactNode;
    tone?: "default" | "warning";
  }) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
          tone === "warning"
            ? "border-warning/30 bg-warning-bg text-warning"
            : "border-border bg-bg-surface text-text-secondary",
        )}
      >
        <span className="mt-0.5 flex-none">{icon}</span>
        <span>{children}</span>
      </div>
    );
  }
