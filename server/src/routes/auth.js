import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User, Account } from '../models.js'
import { sequelize } from '../db.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Register
router.post('/register', async (req, res) => {
	try {
		const { email, fullName, password } = req.body || {}
		
		if (!email || !fullName || !password) {
			return res.status(400).json({ success: false, error: 'Missing required fields' })
		}
		
		if (password.length < 6) {
			return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' })
		}
		
		const result = await sequelize.transaction(async (t) => {
			// Check if user exists
			const existing = await User.findOne({ where: { email }, transaction: t })
			if (existing) {
				throw new Error('Email already registered')
			}
			
			// Hash password
			const hashedPassword = await bcrypt.hash(password, 10)
			
			// Create user
			const user = await User.create({
				email,
				fullName,
				password: hashedPassword
			}, { transaction: t })
			
			// Create account
			await Account.create({
				userId: user.id,
				balance: '0.00',
				currency: 'BDT'
			}, { transaction: t })
			
			// Generate token
			const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
			
			return {
				token,
				user: {
					id: user.id,
					email: user.email,
					fullName: user.fullName
				}
			}
		})
		
		return res.status(201).json({ success: true, ...result })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

// Login
router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body || {}
		
		if (!email || !password) {
			return res.status(400).json({ success: false, error: 'Email and password required' })
		}
		
		const user = await User.findOne({ where: { email } })
		if (!user) {
			return res.status(401).json({ success: false, error: 'Invalid email or password' })
		}
		
		const valid = await bcrypt.compare(password, user.password)
		if (!valid) {
			return res.status(401).json({ success: false, error: 'Invalid email or password' })
		}
		
		const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
		
		return res.json({
			success: true,
			token,
			user: {
				id: user.id,
				email: user.email,
				fullName: user.fullName
			}
		})
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

// Get current user profile
router.get('/me', async (req, res) => {
	try {
		const authHeader = req.headers.authorization
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({ success: false, error: 'No token provided' })
		}
		
		const token = authHeader.substring(7)
		const decoded = jwt.verify(token, JWT_SECRET)
		
		const user = await User.findByPk(decoded.userId, {
			include: [{ model: Account, as: 'account' }]
		})
		
		if (!user) {
			return res.status(404).json({ success: false, error: 'User not found' })
		}
		
		return res.json({
			success: true,
			user: {
				id: user.id,
				email: user.email,
				fullName: user.fullName,
				balance: user.account ? Number(user.account.balance).toFixed(2) : '0.00'
			}
		})
	} catch (e) {
		return res.status(401).json({ success: false, error: 'Invalid or expired token' })
	}
})

export default router


