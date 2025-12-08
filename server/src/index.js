import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { sequelize } from './db.js'
import { User } from './models.js'
import topupRoutes from './routes/topup.js'
import loanRoutes from './routes/loans.js'
import requestRoutes from './routes/requests.js'
import authRoutes from './routes/auth.js'

const app = express()

const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',')
app.use(cors({ origin: corsOrigins, credentials: true }))
app.use(express.json())

app.get('/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api/auth', authRoutes)
app.use('/api', topupRoutes)
app.use('/api', loanRoutes)
app.use('/api', requestRoutes)

const port = Number(process.env.PORT || 9135)

async function start() {
	try {
		await sequelize.authenticate()
		// Use alter: true to update existing tables, or force: true to drop and recreate
		await sequelize.sync({ alter: true })
		console.log('DB connected and synced')

		// Ensure there is at least one demo user for quick testing
		const bcrypt = (await import('bcryptjs')).default
		await User.findOrCreate({
			where: { email: 'demo@example.com' },
			defaults: { 
				fullName: 'Demo User',
				password: await bcrypt.hash('demo123', 10)
			}
		})

		app.listen(port, () => console.log(`Server running on http://localhost:${port}`))
	} catch (e) {
		console.error('Failed to start server:', e)
		process.exit(1)
	}
}

start()


