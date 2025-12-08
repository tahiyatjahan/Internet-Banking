import { Router } from 'express'
import { Account, Transaction, User, MoneyRequest } from '../models.js'
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

// Create a money request
router.post('/requests/create', async (req, res) => {
	try {
		const { fromUserId, toUserId, amount, message } = req.body || {}
		const amt = parseAmount(amount)
		
		if (Number(fromUserId) === Number(toUserId)) {
			throw new Error('Cannot request money from yourself')
		}
		
		const result = await sequelize.transaction(async (t) => {
			const fromUser = await User.findByPk(Number(fromUserId), { transaction: t })
			const toUser = await User.findByPk(Number(toUserId), { transaction: t })
			
			if (!fromUser) throw new Error('Requesting user not found')
			if (!toUser) throw new Error('Target user not found')
			
			const request = await MoneyRequest.create({
				fromUserId: Number(fromUserId),
				toUserId: Number(toUserId),
				amount: amt,
				message: message || null,
				status: 'PENDING'
			}, { transaction: t })
			
			return {
				requestId: request.id,
				fromUserId: Number(fromUserId),
				toUserId: Number(toUserId),
				amount: amt.toFixed(2),
				message: message || '',
				status: 'PENDING'
			}
		})
		
		return res.status(201).json({ success: true, ...result })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

// Accept a money request
router.post('/requests/accept', async (req, res) => {
	try {
		const { requestId, userId } = req.body || {}
		
		const result = await sequelize.transaction(async (t) => {
			const request = await MoneyRequest.findByPk(Number(requestId), { transaction: t })
			
			if (!request) throw new Error('Request not found')
			if (request.toUserId !== Number(userId)) throw new Error('Unauthorized')
			if (request.status !== 'PENDING') throw new Error('Request is not pending')
			
			const fromAccount = await getOrCreateAccount(request.fromUserId, t)
			const toAccount = await getOrCreateAccount(request.toUserId, t)
			
			const amount = Number(request.amount)
			const fromBalance = Number(fromAccount.balance)
			
			if (fromBalance < amount) {
				throw new Error(`Insufficient balance. Required: ${amount.toFixed(2)} BDT, Available: ${fromBalance.toFixed(2)} BDT`)
			}
			
			// Transfer money
			fromAccount.balance = fromBalance - amount
			await fromAccount.save({ transaction: t })
			
			const toBalance = Number(toAccount.balance)
			toAccount.balance = toBalance + amount
			await toAccount.save({ transaction: t })
			
			// Update request status
			request.status = 'ACCEPTED'
			await request.save({ transaction: t })
			
			// Create transaction records
			await Transaction.create({
				accountId: fromAccount.id,
				type: 'MONEY_SENT',
				amount: -amount,
				reference: `REQUEST-${request.id}`
			}, { transaction: t })
			
			await Transaction.create({
				accountId: toAccount.id,
				type: 'MONEY_RECEIVED',
				amount: amount,
				reference: `REQUEST-${request.id}`
			}, { transaction: t })
			
			return {
				requestId: request.id,
				amount: amount.toFixed(2),
				fromBalance: fromAccount.balance.toFixed(2),
				toBalance: toAccount.balance.toFixed(2)
			}
		})
		
		return res.status(200).json({ success: true, ...result })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

// Reject a money request
router.post('/requests/reject', async (req, res) => {
	try {
		const { requestId, userId } = req.body || {}
		
		const result = await sequelize.transaction(async (t) => {
			const request = await MoneyRequest.findByPk(Number(requestId), { transaction: t })
			
			if (!request) throw new Error('Request not found')
			if (request.toUserId !== Number(userId)) throw new Error('Unauthorized')
			if (request.status !== 'PENDING') throw new Error('Request is not pending')
			
			request.status = 'REJECTED'
			await request.save({ transaction: t })
			
			return {
				requestId: request.id,
				status: 'REJECTED'
			}
		})
		
		return res.status(200).json({ success: true, ...result })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

// Get user's money requests (sent and received)
router.get('/requests/:userId', async (req, res) => {
	try {
		const userId = Number(req.params.userId)
		const sent = await MoneyRequest.findAll({
			where: { fromUserId: userId },
			include: [{ model: User, as: 'toUser', attributes: ['id', 'fullName', 'email'] }],
			order: [['created_at', 'DESC']]
		})
		const received = await MoneyRequest.findAll({
			where: { toUserId: userId },
			include: [{ model: User, as: 'fromUser', attributes: ['id', 'fullName', 'email'] }],
			order: [['created_at', 'DESC']]
		})
		return res.json({ success: true, sent, received })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

export default router

