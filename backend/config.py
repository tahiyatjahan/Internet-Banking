import os
from dataclasses import dataclass


@dataclass
class Config:
	secret_key: str = os.getenv("SECRET_KEY", "dev-secret")
	db_host: str = os.getenv("DB_HOST", "localhost")
	db_port: str = os.getenv("DB_PORT", "3306")
	db_name: str = os.getenv("DB_NAME", "internet_banking")
	db_user: str = os.getenv("DB_USER", "root")
	db_password: str = os.getenv("DB_PASSWORD", "password")
	cors_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:5173")

	@property
	def sqlalchemy_database_uri(self) -> str:
		return f"mysql+pymysql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"


