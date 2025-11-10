from pathlib import Path
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from config import Config
from database import db
from routes import api_bp


def create_app() -> Flask:
	# Load environment variables from .env in this directory if present
	load_dotenv(dotenv_path=Path(__file__).parent / ".env")
	app = Flask(__name__)
	cfg = Config()

	app.config["SECRET_KEY"] = cfg.secret_key
	app.config["SQLALCHEMY_DATABASE_URI"] = cfg.sqlalchemy_database_uri
	app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

	CORS(app, resources={r"/api/*": {"origins": cfg.cors_origins.split(",")}})

	db.init_app(app)
	with app.app_context():
		# Import models to ensure they are registered
		from models import Account, Transaction, User  # noqa: F401
		db.create_all()

	@app.get("/health")
	def health():
		return jsonify({"status": "ok"})

	app.register_blueprint(api_bp)

	# Simple CLI to init DB tables explicitly if needed
	@app.cli.command("db-init")
	def db_init():
		from models import Account, Transaction, User  # noqa: F401
		db.create_all()
		print("Database tables created.")

	return app


app = create_app()


