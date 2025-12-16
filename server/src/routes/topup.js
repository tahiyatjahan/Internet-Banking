import { Router } from 'express'
import { Account, Transaction, User } from '../models.js'
import { sequelize } from '../db.js'
import { generateAccountNumber, createNotification } from '../utils.js'

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

function validateCard(body) {
	const { cardNumber, expiryMonth, expiryYear, cvv } = body
	if (!cardNumber || !expiryMonth || !expiryYear || !cvv) throw new Error('Missing card details')
	if (String(cardNumber).length < 12 || String(cardNumber).length > 19) throw new Error('Invalid card number')
	if (!/^[0-9]{3,4}$/.test(String(cvv))) throw new Error('Invalid CVV')
}

function validateBank(body) {
	const { bankName, accountNumber, routingNumber } = body
	if (!bankName || !accountNumber || !routingNumber) throw new Error('Missing bank transfer details')
	if (!/^[0-9]{9}$/.test(String(routingNumber))) throw new Error('Invalid routing number')
}

function validatePrepaidCard(body) {
	const { cardNumber, pin } = body
	if (!cardNumber || !pin) throw new Error('Missing prepaid card details')
	if (String(cardNumber).length < 12 || String(cardNumber).length > 19) throw new Error('Invalid card number')
	if (String(pin).length < 4 || String(pin).length > 6) throw new Error('Invalid PIN')
}

router.post('/topup/card', async (req, res) => {
	try {
		const { userId, amount } = req.body || {}
		validateCard(req.body || {})
		const amt = parseAmount(amount)
		const result = await sequelize.transaction(async (t) => {
			const account = await getOrCreateAccount(Number(userId), t)
			const currentBalance = parseFloat(String(account.balance)) || 0
			const newBalance = currentBalance + amt
			account.balance = newBalance.toFixed(2)
			await account.save({ transaction: t })
			const txn = await Transaction.create({ accountId: account.id, type: 'CARD_TOPUP', amount: amt, reference: 'CARD' }, { transaction: t })
			
			// Create notification
			await createNotification(
				Number(userId),
				'Card Top-up Successful',
				`You have successfully added ৳${amt.toFixed(2)} to your account via card. Your new balance is ৳${newBalance.toFixed(2)}.`,
				'TOPUP',
				t
			)
			
			return { balance: newBalance.toFixed(2), transactionId: txn.id }
		})
		return res.status(201).json({ success: true, ...result })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

router.post('/topup/bank', async (req, res) => {
	try {
		const { userId, amount } = req.body || {}
		validateBank(req.body || {})
		const amt = parseAmount(amount)
		const result = await sequelize.transaction(async (t) => {
			const account = await getOrCreateAccount(Number(userId), t)
			const currentBalance = parseFloat(String(account.balance)) || 0
			const newBalance = currentBalance + amt
			account.balance = newBalance.toFixed(2)
			await account.save({ transaction: t })
			const txn = await Transaction.create({ accountId: account.id, type: 'BANK_TOPUP', amount: amt, reference: 'BANK' }, { transaction: t })
			
			// Create notification
			await createNotification(
				Number(userId),
				'Bank Transfer Successful',
				`You have successfully added ৳${amt.toFixed(2)} to your account via bank transfer. Your new balance is ৳${newBalance.toFixed(2)}.`,
				'TOPUP',
				t
			)
			
			return { balance: newBalance.toFixed(2), transactionId: txn.id }
		})
		return res.status(201).json({ success: true, ...result })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

router.post('/topup/prepaid', async (req, res) => {
	try {
		const { userId, amount, cardNumber, pin } = req.body || {}
		validatePrepaidCard(req.body || {})
		const amt = parseAmount(amount)
		const result = await sequelize.transaction(async (t) => {
			const account = await getOrCreateAccount(Number(userId), t)
			const currentBalance = parseFloat(String(account.balance)) || 0
			const newBalance = currentBalance + amt
			account.balance = newBalance.toFixed(2)
			await account.save({ transaction: t })
			const txn = await Transaction.create({ accountId: account.id, type: 'PREPAID_TOPUP', amount: amt, reference: 'PREPAID' }, { transaction: t })
			
			// Create notification
			await createNotification(
				Number(userId),
				'Prepaid Top-up Successful',
				`You have successfully added ৳${amt.toFixed(2)} to your account via prepaid card. Your new balance is ৳${newBalance.toFixed(2)}.`,
				'TOPUP',
				t
			)
			
			return { balance: newBalance.toFixed(2), transactionId: txn.id }
		})
		return res.status(201).json({ success: true, ...result })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

export default router


