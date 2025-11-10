## Internet Banking - Module 1 (Top-ups)

Stack:
- Language: JavaScript (frontend) + Python (backend)
- Frameworks: Flask (backend) + React.js (frontend)
- Styling: CSS
- Database: MySQL
- ORM: SQLAlchemy
- Deployment: Render (backend) + Vercel (frontend) + Railway (DB)

This module implements two features:
- Add money from Visa/MasterCard (mocked card processor)
- Add money from Banks (ACH/bank transfer, mocked)

### Project Structure
```
backend/
  app.py
  config.py
  database.py
  models.py
  routes/
    __init__.py
    topup.py
  requirements.txt
  .env.example
frontend/
  (Vite React app)
.gitignore
README.md
```

### Prerequisites
- Python 3.10+
- Node 18+
- MySQL 8 (or Railway MySQL)

### Backend Setup
1. Create and fill env:
   - Copy `backend/.env.example` to `backend/.env` and set values.
2. Create virtualenv and install:
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
3. Initialize database tables:
   ```bash
   flask --app app.py db-init
   ```
4. Run backend:
   ```bash
   flask --app app.py run --debug
   ```

### Frontend Setup
1. Install deps and run:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Ensure `VITE_API_BASE` in `frontend/.env` points to the backend (e.g., `http://localhost:5000`).

### API Endpoints
- `POST /api/topup/card`
  - body: `{ "userId": 1, "amount": 100.00, "cardNumber": "4111111111111111", "expiryMonth": "12", "expiryYear": "2030", "cvv": "123" }`
- `POST /api/topup/bank`
  - body: `{ "userId": 1, "amount": 100.00, "bankName": "Chase", "accountNumber": "123456789", "routingNumber": "021000021" }`

Both create a `Transaction` and credit the user's `Account` balance upon success (mocked processor validation).

### Deployment (high-level)
- Backend to Render: set environment variables, start command `gunicorn app:app`.
- Frontend to Vercel: set `VITE_API_BASE` env var to Render backend URL.
- Database on Railway: create MySQL instance and copy credentials to backend `.env`.

### GitHub
To initialize and push:
```bash
cd /Users/namu/InternetBanking
git init
git add .
git commit -m "Initial commit: Module 1 top-ups (card & bank)"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```


