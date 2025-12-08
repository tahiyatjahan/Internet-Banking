## Internet Banking - Module 1 (Top-ups)

Stack:
- Language: JavaScript (frontend + backend)
- Frameworks: Express (backend) + React.js (frontend)
- Styling: CSS
- Database: MySQL
- ORM: Sequelize
- Deployment: Render (or Railway) for backend + Vercel for frontend + Railway for DB

This module implements two features:
- Add money from Visa/MasterCard (mocked card processor)
- Add money from Banks (ACH/bank transfer, mocked)

### Project Structure
```
server/
  package.json
  src/
    index.js
    db.js
    models.js
    routes/
      topup.js
  .env.example
frontend/
  (Vite React app)
.gitignore
README.md
```

### Prerequisites
- Node 18+
- MySQL 8 (or Railway MySQL)

### Backend (Node/Express) Setup
1. Create and fill env:
   - Copy `server/.env.example` to `server/.env` and set values (`PORT=9135` to match defaults).
2. Install and run:
   ```bash
   cd server
   npm install
   npm run dev
   ```
   - The server will connect to MySQL and auto-create tables via `sequelize.sync()`.
   - Default URL: `http://localhost:9135`

### Frontend Setup
1. Install deps and run:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Ensure `VITE_API_BASE` in `frontend/.env` points to the backend (e.g., `http://localhost:5000`).
   - Default fallback is now `http://localhost:9135`, so use that value unless deployed elsewhere.

### API Endpoints
- `POST /api/topup/card`
  - body: `{ "userId": 1, "amount": 100.00, "cardNumber": "4111111111111111", "expiryMonth": "12", "expiryYear": "2030", "cvv": "123" }`
- `POST /api/topup/bank`
  - body: `{ "userId": 1, "amount": 100.00, "bankName": "Chase", "accountNumber": "123456789", "routingNumber": "021000021" }`

Both create a `Transaction` and credit the user's `Account` balance upon success (mocked processor validation).

### Deployment (high-level)
- Backend (Render/Railway): set environment variables, start command `node src/index.js`.
- Frontend (Vercel): set `VITE_API_BASE` env var to backend URL.
- Database (Railway): create MySQL instance and copy credentials to backend `.env`.

### GitHub
To initialize and push:
```bash
cd /Users/namu/InternetBanking
git init
git add .
git commit -m "Initial commit: Module 1 top-ups (card & bank) - Node backend"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```


