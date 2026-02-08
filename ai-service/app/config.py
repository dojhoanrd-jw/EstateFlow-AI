from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o-mini"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    LLM_MAX_RETRIES: int = 3

    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/estateflow"

    RAG_CHUNK_SIZE: int = 600
    RAG_CHUNK_OVERLAP: int = 100
    RAG_TOP_K: int = 4

    AI_SERVICE_API_KEY: str = ""

    CORS_ORIGINS: str = ""


settings = Settings()  # type: ignore[call-arg]
