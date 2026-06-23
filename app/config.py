"""Application configuration, driven entirely by environment variables.

Every value below can be overridden via env vars (or a local .env file) so the
agent can be re-pointed at a different Bedrock model / region without code
changes. See .env.example for the full list.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- AWS / Bedrock ---------------------------------------------------
    aws_region: str = "us-east-1"
    # NOTE: Bedrock model IDs differ from first-party Anthropic IDs (they are
    # prefixed / inference-profile style). This default is a PLACEHOLDER — set
    # BEDROCK_MODEL_ID to the exact model/inference-profile enabled in YOUR
    # account & region (check the Bedrock console -> Model access).
    bedrock_model_id: str = "us.anthropic.claude-sonnet-4-5-20250929-v1:0"
    bedrock_max_tokens: int = 4096
    # Optional named AWS profile; falls back to the default credential chain.
    aws_profile: str | None = None

    # --- STEP geometry extraction ---------------------------------------
    # g/mm^3 — default is aluminium alloy (~2.7 g/cm^3). Used only to estimate
    # part weight from the solid volume for the feature summary.
    material_density_g_per_mm3: float = 0.0027

    # --- App -------------------------------------------------------------
    api_title: str = "Aether RFQ Machining Operation Extractor"
    api_version: str = "0.1.0"


@lru_cache
def get_settings() -> Settings:
    return Settings()
