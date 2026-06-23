import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Box,
  Upload,
  X,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onSubmit: (pdf: File, step: File) => void;
}

export default function UploadScreen({ onSubmit }: Props) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [stepFile, setStepFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pdfRef = useRef<HTMLInputElement>(null);
  const stepRef = useRef<HTMLInputElement>(null);

  const [pdfDragging, setPdfDragging] = useState(false);
  const [stepDragging, setStepDragging] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile || !stepFile) {
      setError("Please select both a PDF drawing and a STEP file.");
      return;
    }
    setError(null);
    onSubmit(pdfFile, stepFile);
  };

  const makeDrop = useCallback(
    (
      accept: (f: File) => boolean,
      set: (f: File) => void,
      setDragging: (v: boolean) => void,
    ) =>
      ({
        onDragOver: (e: React.DragEvent) => {
          e.preventDefault();
          setDragging(true);
        },
        onDragLeave: () => setDragging(false),
        onDrop: (e: React.DragEvent) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f && accept(f)) set(f);
        },
      }) as React.HTMLAttributes<HTMLDivElement>,
    [],
  );

  const isPdf = (f: File) => f.type === "application/pdf" || f.name.endsWith(".pdf");
  const isStep = (f: File) =>
    f.name.endsWith(".step") || f.name.endsWith(".stp");

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#F8FAFC] flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-white text-xs font-medium text-text-secondary mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
            Claude + AWS Bedrock
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-navy-900 mb-3">
            Machining Operation Extractor
          </h1>
          <p className="text-base text-text-secondary max-w-md mx-auto leading-relaxed">
            Upload a 2D engineering drawing and STEP file to automatically
            extract ordered machining operations for RFQ estimation.
          </p>
        </div>

        {/* Upload Card */}
        <div
          className="bg-white rounded-2xl border border-border shadow-sm p-8"
          style={{ boxShadow: "0 4px 24px rgba(10,22,40,0.07)" }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PDF Upload */}
            <FileDropZone
              label="Engineering Drawing (PDF)"
              icon={<FileText className="w-6 h-6 text-accent-blue" />}
              file={pdfFile}
              accept=".pdf"
              hint="PDF, up to 50 MB"
              dragging={pdfDragging}
              inputRef={pdfRef}
              onClear={() => setPdfFile(null)}
              onFileChange={(f) => {
                if (isPdf(f)) {
                  setPdfFile(f);
                  setError(null);
                } else {
                  setError("Drawing must be a PDF file.");
                }
              }}
              dropProps={makeDrop(
                isPdf,
                (f) => {
                  setPdfFile(f);
                  setError(null);
                },
                setPdfDragging,
              )}
            />

            {/* STEP Upload */}
            <FileDropZone
              label="3D Model (STEP / STP)"
              icon={<Box className="w-6 h-6 text-accent-blue" />}
              file={stepFile}
              accept=".step,.stp"
              hint=".step or .stp, up to 200 MB"
              dragging={stepDragging}
              inputRef={stepRef}
              onClear={() => setStepFile(null)}
              onFileChange={(f) => {
                if (isStep(f)) {
                  setStepFile(f);
                  setError(null);
                } else {
                  setError("3D model must be a .step or .stp file.");
                }
              }}
              dropProps={makeDrop(
                isStep,
                (f) => {
                  setStepFile(f);
                  setError(null);
                },
                setStepDragging,
              )}
            />

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger-bg border border-danger/20 text-sm text-danger">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!pdfFile || !stepFile}
              className={cn(
                "w-full h-12 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all",
                pdfFile && stepFile
                  ? "bg-navy-800 hover:bg-navy-700 text-white shadow-sm hover:shadow"
                  : "bg-bg-panel text-text-muted cursor-not-allowed",
              )}
            >
              <Upload className="w-4 h-4" />
              Extract Machining Operations
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Info Footer */}
        <p className="text-center text-xs text-text-muted mt-6">
          Processing takes ~15–20 seconds. Files are processed locally and never
          stored.
        </p>
      </motion.div>
    </div>
  );
}

interface FileDropZoneProps {
  label: string;
  icon: React.ReactNode;
  file: File | null;
  accept: string;
  hint: string;
  dragging: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onClear: () => void;
  onFileChange: (f: File) => void;
  dropProps: React.HTMLAttributes<HTMLDivElement>;
}

function FileDropZone({
  label,
  icon,
  file,
  accept,
  hint,
  dragging,
  inputRef,
  onClear,
  onFileChange,
  dropProps,
}: FileDropZoneProps) {
  return (
    <div>
      <label className="text-xs font-semibold text-navy-900 block mb-2 uppercase tracking-wider">
        {label}
      </label>

      {file ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-success/40 bg-success-bg">
          <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-navy-900 truncate">
              {file.name}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="p-1 rounded-md hover:bg-success/10 text-text-muted hover:text-danger transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          {...dropProps}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed cursor-pointer transition-all",
            dragging
              ? "border-accent-blue bg-accent-light/30"
              : "border-border hover:border-navy-400 hover:bg-bg-surface",
          )}
        >
          <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center">
            {icon}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-navy-700">
              Drop file here or{" "}
              <span className="text-accent-blue underline">browse</span>
            </p>
            <p className="text-xs text-text-muted mt-0.5">{hint}</p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileChange(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
