import sampleResponse from "../../../response-postman.json";
import type { ExtractResponse } from "@/types";

export function getSampleExtractionResponse(): ExtractResponse {
  return sampleResponse as ExtractResponse;
}
