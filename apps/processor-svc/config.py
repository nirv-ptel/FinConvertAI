import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", "tesseract")
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: list[str] = [".pdf"]

    class Config:
        env_file = ".env"


settings = Settings()
