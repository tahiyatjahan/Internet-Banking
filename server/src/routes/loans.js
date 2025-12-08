import { Router } from 'express'
import { Account, Transaction, User, Loan } from '../models.js'
import { sequelize } from '../db.js'

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
		account = await Account.create({ userId: user.id }, { transaction: t })
	}
	return account
}

// Request a microloan
router.post('/loans/request', async (req, res) => {
	try {
		const { userId, amount, interestRate = 5.0, termDays = 30 } = req.body || {}
		const amt = parseAmount(amount)
		const rate = Number.parseFloat(String(interestRate)) || 5.0
		const term = Number.parseInt(String(termDays)) || 30
		
		if (amt < 100) throw new Error('Minimum loan amount is 100 BDT')
		if (amt > 50000) throw new Error('Maximum loan amount is 50,000 BDT')
		
		const result = await sequelize.transaction(async (t) => {
			const account = await getOrCreateAccount(Number(userId), t)
			
			// Check for existing active loans
			const activeLoans = await Loan.count({
				where: { userId: Number(userId), status: 'ACTIVE' },
				transaction: t
			})
			if (activeLoans > 0) throw new Error('You already have an active loan. Please repay it first.')
			
			// Calculate total amount with interest
			const interest = (amt * rate) / 100
			const totalAmount = amt + interest
			const dueDate = new Date()
			dueDate.setDate(dueDate.getDate() + term)
			
			// Create loan
			const loan = await Loan.create({
				userId: Number(userId),
				amount: amt,
				interestRate: rate,
				totalAmount: totalAmount,
				status: 'ACTIVE',
				dueDate: dueDate
			}, { transaction: t })
			
			// Credit the account
			const currentBalance = parseFloat(String(account.balance)) || 0
			const newBalance = currentBalance + amt
			account.balance = newBalance.toFixed(2)
			await account.save({ transaction: t })
			
			// Create transaction record
			await Transaction.create({
				accountId: account.id,
				type: 'LOAN_DISBURSED',
				amount: amt,
				reference: `LOAN-${loan.id}`
			}, { transaction: t })
			
			return {
				loanId: loan.id,
				amount: amt.toFixed(2),
				interestRate: rate.toFixed(2),
				totalAmount: totalAmount.toFixed(2),
				dueDate: dueDate.toISOString().split('T')[0],
				balance: newBalance.toFixed(2)
			}
		})
		
		return res.status(201).json({ success: true, ...result })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

// Repay a loan
router.post('/loans/repay', async (req, res) => {
	try {
		const { userId, loanId } = req.body || {}
		
		const result = await sequelize.transaction(async (t) => {
			const account = await getOrCreateAccount(Number(userId), t)
			const loan = await Loan.findByPk(Number(loanId), { transaction: t })
			
			if (!loan) throw new Error('Loan not found')
			if (loan.userId !== Number(userId)) throw new Error('Unauthorized')
			if (loan.status !== 'ACTIVE') throw new Error('Loan is not active')
			
			const totalAmount = parseFloat(String(loan.totalAmount)) || 0
			const currentBalance = parseFloat(String(account.balance)) || 0
			
			// Debug logging (remove in production)
			console.log(`Repay loan check - Balance: ${currentBalance}, Required: ${totalAmount}, Account ID: ${account.id}`)
			
			if (currentBalance < totalAmount) {
				throw new Error(`Insufficient balance to repay loan. Required: ${totalAmount.toFixed(2)} BDT (principal + interest), Available: ${currentBalance.toFixed(2)} BDT. Please add more funds to your account.`)
			}
			
			// Deduct from account
			const newBalance = currentBalance - totalAmount
			account.balance = newBalance.toFixed(2)
			await account.save({ transaction: t })
			
			// Update loan status
			loan.status = 'REPAID'
			loan.repaidAt = new Date()
			await loan.save({ transaction: t })
			
			// Create transaction record
			await Transaction.create({
				accountId: account.id,
				type: 'LOAN_REPAID',
				amount: -totalAmount,
				reference: `LOAN-${loan.id}`
			}, { transaction: t })
			
			return {
				loanId: loan.id,
				repaidAmount: totalAmount.toFixed(2),
				balance: newBalance.toFixed(2)
			}
		})
		
		return res.status(200).json({ success: true, ...result })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

// Get user's loans
router.get('/loans/:userId', async (req, res) => {
	try {
		const userId = Number(req.params.userId)
		const loans = await Loan.findAll({
			where: { userId },
			order: [['created_at', 'DESC']]
		})
		return res.json({ success: true, loans })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

export default router

