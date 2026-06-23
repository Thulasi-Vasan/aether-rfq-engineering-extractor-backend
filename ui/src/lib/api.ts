import type { ExtractResponse } from "@/types";

const BASE_URL = "http://localhost:8000";

export async function extractOperations(
  drawingPdf: File,
  stepFile: File,
): Promise<ExtractResponse> {
  const form = new FormData();
  form.append("drawing_pdf", drawingPdf);
  form.append("step_file", stepFile);

  const res = await fetch(`${BASE_URL}/api/v1/extract-operations`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<ExtractResponse>;
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}
