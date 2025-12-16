import { Router } from 'express'
import { TransactionLimit } from '../models.js'
import { authenticate } from '../middleware/auth.js'

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

// Create or update transaction limits for the current user
router.post('/limits/me', async (req, res) => {
	try {
		const userId = req.user.userId
		const { dailyLimit, perTransactionLimit } = req.body || {}

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

		let limits = await TransactionLimit.findOne({ where: { userId } })
		if (!limits) {
			limits = await TransactionLimit.create({
				userId,
				dailyLimit: parsedDaily === null ? null : parsedDaily.toFixed(2),
				perTransactionLimit: parsedPerTx === null ? null : parsedPerTx.toFixed(2),
				usedToday: '0.00',
				lastResetDate: null
			})
		} else {
			limits.dailyLimit = parsedDaily === null ? null : parsedDaily.toFixed(2)
			limits.perTransactionLimit = parsedPerTx === null ? null : parsedPerTx.toFixed(2)
			// Do not reset usedToday here; it will auto-reset on next transaction when the date changes
			await limits.save()
		}

		return res.status(200).json({ success: true, limits })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

export default router


