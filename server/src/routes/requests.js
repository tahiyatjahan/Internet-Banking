import { Router } from 'express'
import { Account, Transaction, User, MoneyRequest } from '../models.js'
import { sequelize } from '../db.js'
import { generateAccountNumber, createNotification, checkAndConsumeLimit } from '../utils.js'


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
		account = await Account.create({ 
			userId: user.id,
			accountNumber,
			balance: '0.00',
			currency: 'BDT'
		}, { transaction: t })
	}
	return account
}


// Helper to find user by account number
async function findUserByAccountNumber(accountNumber, transaction = null) {
	const account = await Account.findOne({ 
		where: { accountNumber },
		transaction
	})
	if (!account) return null
	return await User.findByPk(account.userId, { transaction })
}

router.post('/requests/create', async (req, res) => {
	try {
		const { fromUserId, toAccountNumber, amount } = req.body || {}
		const amt = parseAmount(amount)
		
		if (!toAccountNumber) {
			return res.status(400).json({ success: false, error: 'Account number is required' })
		}
		
		const result = await sequelize.transaction(async (t) => {
			const fromUser = await User.findByPk(Number(fromUserId), { transaction: t })
			if (!fromUser) throw new Error('Requesting user not found')
			
			// Find toUser by account number
			const toUser = await findUserByAccountNumber(toAccountNumber, t)
			if (!toUser) throw new Error('Account number not found')
			
			if (fromUser.id === toUser.id) {
				throw new Error('Cannot request money from yourself')
			}
			
			const request = await MoneyRequest.create({
				fromUserId: Number(fromUserId),
				toUserId: toUser.id,
				amount: amt,
				status: 'PENDING'
			}, { transaction: t })
			
			// Create notifications
			const fromUserAccount = await Account.findOne({ where: { userId: Number(fromUserId) }, transaction: t })
			const toUserAccount = await Account.findOne({ where: { userId: toUser.id }, transaction: t })
			
			// Notify requester
			await createNotification(
				Number(fromUserId),
				'Money Request Sent',
				`You have requested ৳${amt.toFixed(2)} from account ${toUserAccount ? toUserAccount.accountNumber : toAccountNumber}. Waiting for approval.`,
				'REQUEST',
				t
			)
			
			// Notify payer
			await createNotification(
				toUser.id,
				'Money Request Received',
				`You have received a money request of ৳${amt.toFixed(2)} from account ${fromUserAccount ? fromUserAccount.accountNumber : 'N/A'}.`,
				'REQUEST',
				t
			)
			
			return {
				requestId: request.id,
				fromUserId: Number(fromUserId),
				toUserId: toUser.id,
				toAccountNumber: toAccountNumber,
				amount: amt.toFixed(2),
				status: 'PENDING'
			}
		})
		
		return res.status(201).json({ success: true, ...result })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})


router.post('/requests/accept', async (req, res) => {
	try {
		const { requestId, userId } = req.body || {}
		
		const result = await sequelize.transaction(async (t) => {
			const request = await MoneyRequest.findByPk(Number(requestId), { transaction: t })
			
			if (!request) throw new Error('Request not found')
			if (request.toUserId !== Number(userId)) throw new Error('Unauthorized')
			if (request.status !== 'PENDING') throw new Error('Request is not pending')
			
			// Payer = toUser (approver); Receiver = fromUser (requester)
			const payerAccount = await getOrCreateAccount(request.toUserId, t)
			const receiverAccount = await getOrCreateAccount(request.fromUserId, t)
			
			const amount = parseFloat(String(request.amount)) || 0
			const payerBalance = parseFloat(String(payerAccount.balance)) || 0
			
			if (payerBalance < amount) {
				throw new Error(`Insufficient balance. Required: ${amount.toFixed(2)} BDT, Available: ${payerBalance.toFixed(2)} BDT`)
			}

			// Enforce transaction limits for outgoing payments
			await checkAndConsumeLimit(request.toUserId, amount, 'REQUEST', t)
			
			// Transfer money
			const payerNewBalance = payerBalance - amount
			payerAccount.balance = payerNewBalance.toFixed(2)
			await payerAccount.save({ transaction: t })
			
			const receiverBalance = parseFloat(String(receiverAccount.balance)) || 0
			const receiverNewBalance = receiverBalance + amount
			receiverAccount.balance = receiverNewBalance.toFixed(2)
			await receiverAccount.save({ transaction: t })
			
			// Update request status
			request.status = 'ACCEPTED'
			await request.save({ transaction: t })
			
			// Create transaction records
			await Transaction.create({
				accountId: payerAccount.id,
				type: 'MONEY_SENT',
				amount: -amount,
				reference: `REQUEST-${request.id}`
			}, { transaction: t })
			
			await Transaction.create({
				accountId: receiverAccount.id,
				type: 'MONEY_RECEIVED',
				amount: amount,
				reference: `REQUEST-${request.id}`
			}, { transaction: t })
			
			// Create notifications
			// Notify payer (toUser)
			await createNotification(
				request.toUserId,
				'Money Sent',
				`You have sent ৳${amount.toFixed(2)} to account ${receiverAccount.accountNumber}. Your new balance is ৳${payerNewBalance.toFixed(2)}.`,
				'TRANSFER',
				t
			)
			
			// Notify receiver (fromUser)
			await createNotification(
				request.fromUserId,
				'Money Received',
				`You have received ৳${amount.toFixed(2)} from account ${payerAccount.accountNumber}. Your new balance is ৳${receiverNewBalance.toFixed(2)}.`,
				'TRANSFER',
				t
			)
			
			return {
				requestId: request.id,
				amount: amount.toFixed(2),
				fromBalance: receiverNewBalance.toFixed(2),
				toBalance: payerNewBalance.toFixed(2)
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
			
			// Create notifications
			const fromUserAccount = await Account.findOne({ where: { userId: request.fromUserId }, transaction: t })
			const toUserAccount = await Account.findOne({ where: { userId: request.toUserId }, transaction: t })
			
			// Notify requester
			await createNotification(
				request.fromUserId,
				'Money Request Rejected',
				`Your money request of ৳${Number(request.amount).toFixed(2)} has been rejected by account ${toUserAccount ? toUserAccount.accountNumber : 'N/A'}.`,
				'REQUEST',
				t
			)
			
			// Notify rejector
			await createNotification(
				request.toUserId,
				'Money Request Rejected',
				`You have rejected the money request of ৳${Number(request.amount).toFixed(2)} from account ${fromUserAccount ? fromUserAccount.accountNumber : 'N/A'}.`,
				'REQUEST',
				t
			)
			
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
			include: [
				{ 
					model: User, 
					as: 'toUser', 
					attributes: ['id', 'fullName', 'email'],
					include: [{ model: Account, as: 'account', attributes: ['accountNumber'] }]
				}
			],
			order: [['created_at', 'DESC']]
		})
		const received = await MoneyRequest.findAll({
			where: { toUserId: userId },
			include: [
				{ 
					model: User, 
					as: 'fromUser', 
					attributes: ['id', 'fullName', 'email'],
					include: [{ model: Account, as: 'account', attributes: ['accountNumber'] }]
				}
			],
			order: [['created_at', 'DESC']]
		})
		return res.json({ success: true, sent, received })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

export default router

