"""Application configuration, driven entirely by environment variables.

Every value below can be overridden via env vars (or a local .env file) so the
agent can be re-pointed at a different Bedrock model / region without code
changes. See .env.example for the full list.
"""
import json
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

from .schemas import StepFeatureSummary


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- AWS / Bedrock ---------------------------------------------------
    aws_region: str = "us-east-1"
    # NOTE: Bedrock model IDs differ from first-party Anthropic IDs (they are
    # prefixed / inference-profile style). This default is a PLACEHOLDER — set
    # BEDROCK_MODEL_ID to the exact model/inference-profile enabled in YOUR
    # account & region (check the Bedrock console -> Model access).
    bedrock_model_id: str = "us.anthropic.claude-sonnet-4-5-20250929-v1:0"
    # Detailed process plans are long; 4096 truncates the tool call mid-JSON
    # (stop_reason=max_tokens -> 0 operations parsed). Keep this generous.
    bedrock_max_tokens: int = 16384
    # boto3 read timeout (seconds). Detailed process plans can run long, so the
    # default 60s is too short — give the model room to finish.
    bedrock_read_timeout_s: int = 300
    # Optional named AWS profile; falls back to the default credential chain.
    aws_profile: str | None = None

    # --- STEP geometry extraction ---------------------------------------
    # g/mm^3 — default is aluminium alloy (~2.7 g/cm^3). Used only to estimate
    # part weight from the solid volume for the feature summary.
    material_density_g_per_mm3: float = 0.0027

    # Set to false when pythonOCC / cad-occ conda env is not available.
    enable_occ: bool = True
    # When enable_occ=false, set this to true to pass a pre-computed summary to
    # the LLM instead of skipping STEP context entirely.
    use_static_summary: bool = False
    # JSON-encoded StepFeatureSummary stored directly in the env. Only read when
    # enable_occ=false and use_static_summary=true.
    static_step_summary: str | None = None

    def get_static_step_summary(self) -> StepFeatureSummary | None:
        """Parse STATIC_STEP_SUMMARY only when the static-summary path is used."""
        if self.static_step_summary is None or not self.static_step_summary.strip():
            return None
        try:
            raw_summary = json.loads(self.static_step_summary)
        except json.JSONDecodeError as exc:
            raise ValueError(
                "STATIC_STEP_SUMMARY must be valid JSON matching StepFeatureSummary. "
                "Do not use placeholders like [...] or ..."
            ) from exc
        try:
            return StepFeatureSummary.model_validate(raw_summary)
        except ValueError as exc:
            raise ValueError("STATIC_STEP_SUMMARY does not match the StepFeatureSummary schema") from exc

    # --- CORS ------------------------------------------------------------
    # Comma-separated list of allowed origins. Default allows all localhost
    # ports for local frontend dev. Set CORS_ORIGINS in .env for production.
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"]

    # --- App -------------------------------------------------------------
    api_title: str = "Aether RFQ Machining Operation Extractor"
    api_version: str = "0.1.0"


@lru_cache
def get_settings() -> Settings:
    return Settings()
