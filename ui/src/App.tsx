import { useState } from "react";
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

  const handleSubmit = async (pdf: File, step: File) => {
    setState("processing");
    try {
      const data = await extractOperations(pdf, step);
      setResult(data);
      setState("results");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Extraction failed: ${msg}`);
      setState("upload");
    }
  };

  const handleReset = () => {
    setResult(null);
    setState("upload");
  };

  return (
    <>
      <NavBar />
      {state === "upload" && <UploadScreen onSubmit={handleSubmit} />}
      {state === "processing" && <ProcessingScreen />}
      {state === "results" && result && (
        <ResultsScreen result={result} onReset={handleReset} />
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
