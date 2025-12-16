import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { sequelize } from './db.js'
import { User, Account } from './models.js'
import { generateAccountNumber } from './utils.js'
import topupRoutes from './routes/topup.js'
import loanRoutes from './routes/loans.js'
import requestRoutes from './routes/requests.js'
import authRoutes from './routes/auth.js'
import notificationRoutes from './routes/notifications.js'
import internationalRoutes from './routes/international.js'

const app = express()

const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',')
app.use(cors({ origin: corsOrigins, credentials: true }))
app.use(express.json())

app.get('/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api/auth', authRoutes)
app.use('/api', topupRoutes)
app.use('/api', loanRoutes)
app.use('/api', requestRoutes)
app.use('/api', notificationRoutes)
app.use('/api', internationalRoutes)

const port = Number(process.env.PORT || 9135)

async function start() {
	try {
		await sequelize.authenticate()
		
		// Check if accountNumber column exists, if not add it
		try {
			const [results] = await sequelize.query(`
				SELECT COLUMN_NAME 
				FROM INFORMATION_SCHEMA.COLUMNS 
				WHERE TABLE_SCHEMA = DATABASE() 
				AND TABLE_NAME = 'accounts' 
				AND COLUMN_NAME = 'accountNumber'
			`)
			
			if (results.length === 0) {
				console.log('Adding accountNumber column to accounts table...')
				await sequelize.query(`
					ALTER TABLE accounts 
					ADD COLUMN accountNumber VARCHAR(16) NULL UNIQUE AFTER userId
				`)
				console.log('accountNumber column added')
			}
		} catch (e) {
			console.warn('Could not check/add accountNumber column:', e.message)
		}

		// Sync without altering to avoid MySQL key limit errors
		try {
			await sequelize.sync({ alter: false })
			console.log('DB connected and synced')
		} catch (e) {
			console.warn('Sync warning:', e.message)
			// Just authenticate if sync fails
			await sequelize.authenticate()
			console.log('DB connected (sync skipped)')
		}

		// Migrate existing accounts without account numbers
		try {
			const accountsWithoutNumber = await Account.findAll({
				where: {
					accountNumber: null
				}
			})
			
			if (accountsWithoutNumber.length > 0) {
				console.log(`Migrating ${accountsWithoutNumber.length} accounts to add account numbers...`)
				for (const account of accountsWithoutNumber) {
					try {
						const accountNumber = await generateAccountNumber()
						account.accountNumber = accountNumber
						await account.save()
						console.log(`Generated account number ${accountNumber} for account ${account.id}`)
					} catch (e) {
						console.error(`Failed to generate account number for account ${account.id}:`, e)
					}
				}
			}
		} catch (e) {
			console.warn('Migration check skipped:', e.message)
		}

		const bcrypt = (await import('bcryptjs')).default
		const [demoUser] = await User.findOrCreate({
			where: { email: 'demo@example.com' },
			defaults: { 
				fullName: 'Demo User',
				password: await bcrypt.hash('demo123', 10)
			}
		})
		
		// Ensure demo user has an account with account number
		let demoAccount = await Account.findOne({ where: { userId: demoUser.id } })
		if (!demoAccount) {
			const accountNumber = await generateAccountNumber()
			demoAccount = await Account.create({
				userId: demoUser.id,
				accountNumber,
				balance: '0.00',
				currency: 'BDT'
			})
		} else if (!demoAccount.accountNumber) {
			const accountNumber = await generateAccountNumber()
			demoAccount.accountNumber = accountNumber
			await demoAccount.save()
		}

		app.listen(port, () => console.log(`Server running on http://localhost:${port}`))
	} catch (e) {
		console.error('Failed to start server:', e)
		process.exit(1)
	}
}

start()


