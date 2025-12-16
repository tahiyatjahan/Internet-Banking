import { Router } from 'express'
import { Account, Transaction, User, Payee } from '../models.js'
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
	let account = await Account.findOne({ where: { userId: user.id }, transaction: t, lock: t?.LOCK?.UPDATE })
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

async function findAccountByNumber(accountNumber, transaction = null) {
	return Account.findOne({ where: { accountNumber }, transaction, lock: transaction?.LOCK?.UPDATE })
}

// Send money to another registered account
router.post('/transfers/send', async (req, res) => {
	try {
		const { fromUserId, toAccountNumber, amount, note } = req.body || {}
		if (!fromUserId || !toAccountNumber || !amount) {
			return res.status(400).json({ success: false, error: 'Missing required fields' })
		}

		const amt = parseAmount(amount)

		const result = await sequelize.transaction(async (t) => {
			const senderAccount = await getOrCreateAccount(Number(fromUserId), t)
			const recipientAccount = await findAccountByNumber(String(toAccountNumber), t)
			if (!recipientAccount) throw new Error('Recipient account not found')
			if (recipientAccount.userId === Number(fromUserId)) throw new Error('Cannot send money to your own account')

			// Balance check
			const senderBalance = parseFloat(String(senderAccount.balance)) || 0
			if (senderBalance < amt) throw new Error(`Insufficient balance. Required: ${amt.toFixed(2)} BDT, Available: ${senderBalance.toFixed(2)} BDT`)

			// Enforce transaction limits for outgoing transfers
			await checkAndConsumeLimit(Number(fromUserId), amt, 'TRANSFER', t)

			// Deduct and credit
			const newSenderBalance = senderBalance - amt
			senderAccount.balance = newSenderBalance.toFixed(2)
			await senderAccount.save({ transaction: t })

			const recipientBalance = parseFloat(String(recipientAccount.balance)) || 0
			const newRecipientBalance = recipientBalance + amt
			recipientAccount.balance = newRecipientBalance.toFixed(2)
			await recipientAccount.save({ transaction: t })

			// Transactions
			await Transaction.create({
				accountId: senderAccount.id,
				type: 'MONEY_SENT',
				amount: -amt,
				reference: note || `TRANSFER-${recipientAccount.accountNumber}`
			}, { transaction: t })

			await Transaction.create({
				accountId: recipientAccount.id,
				type: 'MONEY_RECEIVED',
				amount: amt,
				reference: note || `TRANSFER-${senderAccount.accountNumber}`
			}, { transaction: t })

			// Notifications
			await createNotification(
				senderAccount.userId,
				'Money Sent',
				`You sent ৳${amt.toFixed(2)} to account ${recipientAccount.accountNumber}. New balance: ৳${newSenderBalance.toFixed(2)}.`,
				'TRANSFER',
				t
			)

			await createNotification(
				recipientAccount.userId,
				'Money Received',
				`You received ৳${amt.toFixed(2)} from account ${senderAccount.accountNumber}. New balance: ৳${newRecipientBalance.toFixed(2)}.`,
				'TRANSFER',
				t
			)

			return {
				fromBalance: newSenderBalance.toFixed(2),
				toBalance: newRecipientBalance.toFixed(2)
			}
		})

		return res.status(200).json({ success: true, ...result })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

// Save a payee for future transfers
router.post('/payees', async (req, res) => {
	try {
		const { userId, accountNumber, nickname } = req.body || {}
		if (!userId || !accountNumber) {
			return res.status(400).json({ success: false, error: 'userId and accountNumber are required' })
		}

		const owner = await User.findByPk(Number(userId))
		if (!owner) return res.status(404).json({ success: false, error: 'User not found' })

		const account = await Account.findOne({ where: { accountNumber } })
		if (!account) return res.status(404).json({ success: false, error: 'Account not found' })
		if (account.userId === Number(userId)) {
			return res.status(400).json({ success: false, error: 'Cannot save your own account as payee' })
		}

		const existing = await Payee.findOne({ where: { userId: Number(userId), payeeAccountNumber: accountNumber } })
		if (existing) {
			existing.nickname = nickname || existing.nickname
			await existing.save()
			return res.json({ success: true, payee: existing })
		}

		const payee = await Payee.create({
			userId: Number(userId),
			payeeUserId: account.userId,
			payeeAccountNumber: account.accountNumber,
			nickname: nickname || null
		})

		return res.status(201).json({ success: true, payee })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

// Get saved payees for a user
router.get('/payees/:userId', async (req, res) => {
	try {
		const userId = Number(req.params.userId)
		const payees = await Payee.findAll({
			where: { userId },
			include: [
				{ model: User, as: 'owner', attributes: ['id', 'fullName', 'email'] }
			],
			order: [['created_at', 'DESC']]
		})
		return res.json({ success: true, payees })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

// Delete a saved payee
router.delete('/payees/:payeeId', async (req, res) => {
	try {
		const payeeId = Number(req.params.payeeId)
		const userId = Number(req.body?.userId || req.query?.userId)
		if (!userId) return res.status(400).json({ success: false, error: 'userId is required' })

		const payee = await Payee.findByPk(payeeId)
		if (!payee) return res.status(404).json({ success: false, error: 'Payee not found' })
		if (payee.userId !== userId) return res.status(403).json({ success: false, error: 'Unauthorized' })

		await payee.destroy()
		return res.json({ success: true, deleted: true })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

export default router

