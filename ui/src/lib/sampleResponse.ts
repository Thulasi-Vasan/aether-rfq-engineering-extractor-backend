import sampleResponse from "../../../response.json";
import type { ExtractResponse } from "@/types";

export function getSampleExtractionResponse(): ExtractResponse {
  return sampleResponse as ExtractResponse;
}
