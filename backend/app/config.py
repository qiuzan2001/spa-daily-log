from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://localhost/spa_dashboard"
    secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    spa_platform_api_url: str = "http://127.0.0.1:8000"
    spa_platform_api_key: str = ""
    spa_platform_tenant_id: str = "default"
    workbench_sync_enabled: bool = True

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()