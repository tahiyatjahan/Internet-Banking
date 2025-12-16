import { Router } from 'express'
import { TransactionLimit } from '../models.js'
import { authenticate } from '../middleware/auth.js'
import { generateAndSendLimitOTP, verifyLimitOTP } from '../utils.js'
import { sequelize } from '../db.js'

const router = Router()

// All limit routes require authentication
router.use(authenticate)

// Get current user's transaction limits
router.get('/limits/me', async (req, res) => {
	try {
		const userId = req.user.userId
		const limits = await TransactionLimit.findOne({ where: { userId } })
		return res.json({
			success: true,
			limits: limits || null
		})
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

// Request OTP to change transaction limits
router.post('/limits/request-otp', async (req, res) => {
	try {
		const userId = req.user.userId
		
		// Generate and send OTP
		const otp = await generateAndSendLimitOTP(userId)
		
		// In development mode (when SMTP not configured), include OTP in response for convenience
		const isDevMode = !process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS
		
		return res.json({
			success: true,
			message: isDevMode 
				? `OTP generated. Check server console or see OTP below.`
				: 'OTP has been sent to your email address. Please check your inbox.',
			...(isDevMode && { otp: otp }) // Only include OTP in dev mode
		})
	} catch (e) {
		console.error('Error in /limits/request-otp:', e)
		return res.status(400).json({ 
			success: false, 
			error: e.message || 'Failed to send OTP. Please try again.' 
		})
	}
})

// Create or update transaction limits for the current user (requires OTP)
router.post('/limits/me', async (req, res) => {
	try {
		const userId = req.user.userId
		const { dailyLimit, perTransactionLimit, otp } = req.body || {}

		if (!otp) {
			return res.status(400).json({ 
				success: false, 
				error: 'OTP is required to change transaction limits. Please request an OTP first.' 
			})
		}

		const parsedDaily =
			dailyLimit === null || dailyLimit === '' || typeof dailyLimit === 'undefined'
				? null
				: Number.parseFloat(String(dailyLimit))
		const parsedPerTx =
			perTransactionLimit === null || perTransactionLimit === '' || typeof perTransactionLimit === 'undefined'
				? null
				: Number.parseFloat(String(perTransactionLimit))

		if (parsedDaily !== null && (!Number.isFinite(parsedDaily) || parsedDaily <= 0)) {
			throw new Error('Daily limit must be a positive number or left blank')
		}
		if (parsedPerTx !== null && (!Number.isFinite(parsedPerTx) || parsedPerTx <= 0)) {
			throw new Error('Per-transaction limit must be a positive number or left blank')
		}

		const result = await sequelize.transaction(async (t) => {
			// Verify OTP
			await verifyLimitOTP(userId, otp, t)

			// Update limits
			let limits = await TransactionLimit.findOne({ where: { userId }, transaction: t })
			if (!limits) {
				limits = await TransactionLimit.create({
					userId,
					dailyLimit: parsedDaily === null ? null : parsedDaily.toFixed(2),
					perTransactionLimit: parsedPerTx === null ? null : parsedPerTx.toFixed(2),
					usedToday: '0.00',
					lastResetDate: null
				}, { transaction: t })
			} else {
				limits.dailyLimit = parsedDaily === null ? null : parsedDaily.toFixed(2)
				limits.perTransactionLimit = parsedPerTx === null ? null : parsedPerTx.toFixed(2)
				// Do not reset usedToday here; it will auto-reset on next transaction when the date changes
				await limits.save({ transaction: t })
			}

			return limits
		})

		return res.status(200).json({ success: true, limits: result })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

export default router


