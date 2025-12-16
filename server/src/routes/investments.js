import { Router } from 'express'
import { Account, Transaction, User, BusinessInvestment } from '../models.js'
import { sequelize } from '../db.js'
import { generateAccountNumber, createNotification, checkAndConsumeLimit } from '../utils.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

function parseAmount(value) {
	const n = Number.parseFloat(String(value))
	if (!Number.isFinite(n) || n <= 0) throw new Error('Amount must be positive')
	return Number(n.toFixed(2))
}

async function getOrCreateAccount(userId, t) {
	const user = await User.findByPk(userId, { transaction: t })
	if (!user) throw new Error('User not found')
	let account = await Account.findOne({ where: { userId: user.id }, transaction: t, lock: t.LOCK.UPDATE })
	if (!account) {
		const accountNumber = await generateAccountNumber(t)
		account = await Account.create(
			{
				userId: user.id,
				accountNumber,
				balance: '0.00',
				currency: 'BDT'
			},
			{ transaction: t }
		)
	}
	return account
}

// All investment routes require authentication
router.use(authenticate)

// Create a new business investment (money moves out of the main account)
router.post('/investments', async (req, res) => {
	try {
		const userId = req.user.userId
		const { businessName, amount, monthlyReturnRate = 2.0, termMonths = 12 } = req.body || {}

		if (!businessName) throw new Error('Business name is required')

		const amt = parseAmount(amount)
		const rate = Number.parseFloat(String(monthlyReturnRate)) || 2.0
		const term = Number.parseInt(String(termMonths)) || 12

		if (amt < 500) throw new Error('Minimum investment amount is 500 BDT')
		if (amt > 200000) throw new Error('Maximum investment amount is 200,000 BDT')
		if (rate <= 0) throw new Error('Monthly return rate must be positive')
		if (term <= 0 || term > 120) throw new Error('Term must be between 1 and 120 months')

		const result = await sequelize.transaction(async (t) => {
			const account = await getOrCreateAccount(Number(userId), t)
			const currentBalance = parseFloat(String(account.balance)) || 0
			if (currentBalance < amt) {
				throw new Error(
					`Insufficient balance to invest. Required: ৳${amt.toFixed(2)}, Available: ৳${currentBalance.toFixed(2)}.`
				)
			}

			// Enforce per-transaction and daily limits for outgoing investments
			await checkAndConsumeLimit(userId, amt, 'INVESTMENT', t)

			// Deduct from account
			const newBalance = currentBalance - amt
			account.balance = newBalance.toFixed(2)
			await account.save({ transaction: t })

			// Create investment record
			const investedAt = new Date()
			const investment = await BusinessInvestment.create(
				{
					userId,
					businessName,
					amount: amt,
					monthlyReturnRate: rate,
					termMonths: term,
					status: 'ACTIVE',
					investedAt
				},
				{ transaction: t }
			)

			// Record transaction
			await Transaction.create(
				{
					accountId: account.id,
					type: 'INVEST_OUT',
					amount: -amt,
					reference: `INVEST-${investment.id}`
				},
				{ transaction: t }
			)

			// Notify user
			await createNotification(
				userId,
				'Investment Created',
				`You invested ৳${amt.toFixed(2)} in "${businessName}" with an expected monthly return of ${rate.toFixed(
					2
				)}% for ${term} months.`,
				'GENERAL',
				t
			)

			return {
				investmentId: investment.id,
				businessName,
				amount: amt.toFixed(2),
				monthlyReturnRate: rate.toFixed(2),
				termMonths: term,
				balance: newBalance.toFixed(2)
			}
		})

		return res.status(201).json({ success: true, ...result })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

// Redeem an investment: credit principal + accrued monthly returns and close it
router.post('/investments/:id/redeem', async (req, res) => {
	try {
		const userId = req.user.userId
		const investmentId = Number(req.params.id)

		const result = await sequelize.transaction(async (t) => {
			const investment = await BusinessInvestment.findByPk(investmentId, { transaction: t })
			if (!investment) throw new Error('Investment not found')
			if (investment.userId !== Number(userId)) throw new Error('Unauthorized')
			if (investment.status !== 'ACTIVE') throw new Error('Investment is not active')

			const principal = parseFloat(String(investment.amount)) || 0
			const rate = parseFloat(String(investment.monthlyReturnRate)) || 0
			const term = Number(investment.termMonths) || 0
			const investedAt = new Date(investment.investedAt)
			const now = new Date()

			const msPerMonth = 1000 * 60 * 60 * 24 * 30
			const monthsHeld = Math.floor((now.getTime() - investedAt.getTime()) / msPerMonth)
			const effectiveMonths = Math.max(1, Math.min(term, monthsHeld || 1))

			const profit = principal * (rate / 100) * effectiveMonths
			const totalPayout = principal + profit

			const account = await getOrCreateAccount(Number(userId), t)
			const currentBalance = parseFloat(String(account.balance)) || 0
			const newBalance = currentBalance + totalPayout
			account.balance = newBalance.toFixed(2)
			await account.save({ transaction: t })

			investment.status = 'COMPLETED'
			await investment.save({ transaction: t })

			await Transaction.create(
				{
					accountId: account.id,
					type: 'INVEST_RETURN',
					amount: totalPayout,
					reference: `INVEST-${investment.id}`
				},
				{ transaction: t }
			)

			await createNotification(
				userId,
				'Investment Redeemed',
				`Your investment in "${investment.businessName}" has been redeemed. Principal: ৳${principal.toFixed(
					2
				)}, Profit: ৳${profit.toFixed(2)}, Total credited: ৳${totalPayout.toFixed(2)}.`,
				'GENERAL',
				t
			)

			return {
				investmentId: investment.id,
				principal: principal.toFixed(2),
				profit: profit.toFixed(2),
				totalPayout: totalPayout.toFixed(2),
				balance: newBalance.toFixed(2)
			}
		})

		return res.status(200).json({ success: true, ...result })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

// List current user's investments
router.get('/investments', async (req, res) => {
	try {
		const userId = req.user.userId
		const investments = await BusinessInvestment.findAll({
			where: { userId },
			order: [['created_at', 'DESC']]
		})
		return res.json({ success: true, investments })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

export default router


