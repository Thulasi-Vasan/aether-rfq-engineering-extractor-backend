import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { NavBar } from "@/components/NavBar";
import UploadScreen from "@/components/UploadScreen";
import ProcessingScreen from "@/components/ProcessingScreen";
import ResultsScreen from "@/components/ResultsScreen";
import { extractOperations } from "@/lib/api";
import type { AppState, ExtractResponse } from "@/types";

export default function App() {
  const [state, setState] = useState<AppState>("upload");
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const handleSubmit = async (
    pdf: File,
    step: File | null,
  ) => {
    const nextPdfUrl = URL.createObjectURL(pdf);
    setPdfUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return nextPdfUrl;
    });


    if (!step) {
      toast.error("Please select a STEP file.");
      URL.revokeObjectURL(nextPdfUrl);
      setPdfUrl(null);
      return;
    }

    setState("processing");
    try {
      const data = await extractOperations(pdf, step);
      setResult(data);
      setState("results");
    } catch (err) {
      console.error("Extraction caught error:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Extraction failed: ${msg}`);
      alert(`Extraction failed! Error: ${msg}\n\nPlease copy this error and report it.`);
      URL.revokeObjectURL(nextPdfUrl);
      setPdfUrl(null);
      setState("upload");
    }
  };

  const handleReset = () => {
    setResult(null);
    setPdfUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setState("upload");
  };

  return (
    <>
      <NavBar />
      {state === "upload" && <UploadScreen onSubmit={handleSubmit} />}
      {state === "processing" && <ProcessingScreen />}
      {state === "results" && result && pdfUrl && (
        <ResultsScreen result={result} pdfUrl={pdfUrl} onReset={handleReset} />
      )}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            backgroundColor: "#fff",
            color: "#0a1628",
            border: "1px solid #d1d9e6",
          },
        }}
        closeButton
      />
    </>
  );
}
