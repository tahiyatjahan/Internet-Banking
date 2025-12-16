import { Router } from 'express'
import { Account, Transaction, User } from '../models.js'
import { sequelize } from '../db.js'
import { generateAccountNumber, createNotification } from '../utils.js'

const router = Router()

// Currency conversion rates (relative to BDT)
// These are approximate rates - in production, use a real-time currency API
const EXCHANGE_RATES = {
	BDT: 1.0,
	USD: 0.0091, // 1 BDT = 0.0091 USD (approximately 110 BDT = 1 USD)
	EUR: 0.0083, // 1 BDT = 0.0083 EUR
	GBP: 0.0072, // 1 BDT = 0.0072 GBP
	INR: 0.76,   // 1 BDT = 0.76 INR
	AED: 0.033,  // 1 BDT = 0.033 AED
	SAR: 0.034,  // 1 BDT = 0.034 SAR
	CAD: 0.012,  // 1 BDT = 0.012 CAD
	AUD: 0.014,  // 1 BDT = 0.014 AUD
	JPY: 1.36,   // 1 BDT = 1.36 JPY
	CNY: 0.066,  // 1 BDT = 0.066 CNY
}

const CURRENCY_SYMBOLS = {
	BDT: '৳',
	USD: '$',
	EUR: '€',
	GBP: '£',
	INR: '₹',
	AED: 'د.إ',
	SAR: '﷼',
	CAD: 'C$',
	AUD: 'A$',
	JPY: '¥',
	CNY: '¥',
}

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

// Get available currencies and exchange rates
router.get('/international/currencies', (req, res) => {
	const currencies = Object.keys(EXCHANGE_RATES).map(code => ({
		code,
		symbol: CURRENCY_SYMBOLS[code] || code,
		rate: EXCHANGE_RATES[code],
		name: getCurrencyName(code)
	}))
	
	res.json({ success: true, currencies })
})

function getCurrencyName(code) {
	const names = {
		BDT: 'Bangladeshi Taka',
		USD: 'US Dollar',
		EUR: 'Euro',
		GBP: 'British Pound',
		INR: 'Indian Rupee',
		AED: 'UAE Dirham',
		SAR: 'Saudi Riyal',
		CAD: 'Canadian Dollar',
		AUD: 'Australian Dollar',
		JPY: 'Japanese Yen',
		CNY: 'Chinese Yuan',
	}
	return names[code] || code
}

// Calculate conversion
router.post('/international/calculate', (req, res) => {
	try {
		const { fromCurrency, toCurrency, amount } = req.body || {}
		
		if (!fromCurrency || !toCurrency || !amount) {
			return res.status(400).json({ success: false, error: 'Missing required fields' })
		}
		
		if (!EXCHANGE_RATES[fromCurrency] || !EXCHANGE_RATES[toCurrency]) {
			return res.status(400).json({ success: false, error: 'Invalid currency code' })
		}
		
		const amt = parseAmount(amount)
		
		// Convert to BDT first, then to target currency
		const amountInBDT = amt / EXCHANGE_RATES[fromCurrency]
		const convertedAmount = amountInBDT * EXCHANGE_RATES[toCurrency]
		
		// Add transfer fee (2% of the amount, minimum 50 BDT)
		const feeInBDT = Math.max(amountInBDT * 0.02, 50)
		const totalInBDT = amountInBDT + feeInBDT
		
		return res.json({
			success: true,
			originalAmount: amt.toFixed(2),
			convertedAmount: convertedAmount.toFixed(2),
			exchangeRate: (EXCHANGE_RATES[toCurrency] / EXCHANGE_RATES[fromCurrency]).toFixed(4),
			fee: feeInBDT.toFixed(2),
			totalDeduction: totalInBDT.toFixed(2),
			fromCurrency,
			toCurrency
		})
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

// Send money internationally
router.post('/international/send', async (req, res) => {
	try {
		const { 
			fromUserId, 
			toAccountNumber, 
			amount, 
			fromCurrency, 
			toCurrency,
			recipientName,
			recipientEmail
		} = req.body || {}
		
		if (!fromUserId || !toAccountNumber || !amount || !fromCurrency || !toCurrency) {
			return res.status(400).json({ success: false, error: 'Missing required fields' })
		}
		
		if (!EXCHANGE_RATES[fromCurrency] || !EXCHANGE_RATES[toCurrency]) {
			return res.status(400).json({ success: false, error: 'Invalid currency code' })
		}
		
		const amt = parseAmount(amount)
		
		const result = await sequelize.transaction(async (t) => {
			const fromUser = await User.findByPk(Number(fromUserId), { transaction: t })
			if (!fromUser) throw new Error('Sender user not found')
			
			// Get sender account (must be in BDT or convert)
			const senderAccount = await getOrCreateAccount(Number(fromUserId), t)
			
			// Calculate conversion and fees
			const amountInBDT = amt / EXCHANGE_RATES[fromCurrency]
			const convertedAmount = amountInBDT * EXCHANGE_RATES[toCurrency]
			const feeInBDT = Math.max(amountInBDT * 0.02, 50)
			const totalInBDT = amountInBDT + feeInBDT
			
			// Check balance
			const currentBalance = parseFloat(String(senderAccount.balance)) || 0
			if (currentBalance < totalInBDT) {
				throw new Error(`Insufficient balance. Required: ${totalInBDT.toFixed(2)} BDT, Available: ${currentBalance.toFixed(2)} BDT`)
			}
			
			// Find recipient by account number
			const recipientAccount = await Account.findOne({ 
				where: { accountNumber: toAccountNumber },
				transaction: t
			})
			
			if (!recipientAccount) {
				throw new Error('Recipient account not found')
			}
			
			// Deduct from sender (in BDT)
			const senderNewBalance = currentBalance - totalInBDT
			senderAccount.balance = senderNewBalance.toFixed(2)
			await senderAccount.save({ transaction: t })
			
			// Add to recipient (in their account currency)
			// For simplicity, we'll convert the BDT amount to recipient's currency
			// In a real system, you'd handle multi-currency accounts
			const recipientBalance = parseFloat(String(recipientAccount.balance)) || 0
			const recipientCurrency = recipientAccount.currency || 'BDT'
			
			// Convert to recipient's currency if different
			let creditAmount = amountInBDT
			if (recipientCurrency !== 'BDT' && EXCHANGE_RATES[recipientCurrency]) {
				creditAmount = amountInBDT * EXCHANGE_RATES[recipientCurrency] / EXCHANGE_RATES['BDT']
			}
			
			const recipientNewBalance = recipientBalance + creditAmount
			recipientAccount.balance = recipientNewBalance.toFixed(2)
			await recipientAccount.save({ transaction: t })
			
			// Create transaction records
			await Transaction.create({
				accountId: senderAccount.id,
				type: 'INTERNATIONAL_SEND',
				amount: -totalInBDT,
				reference: `INT-${fromCurrency}-${toCurrency}-${toAccountNumber}`
			}, { transaction: t })
			
			await Transaction.create({
				accountId: recipientAccount.id,
				type: 'INTERNATIONAL_RECEIVE',
				amount: creditAmount,
				reference: `INT-${fromCurrency}-${toCurrency}-${senderAccount.accountNumber}`
			}, { transaction: t })
			
			// Get recipient user for notifications
			const recipientUser = await User.findByPk(recipientAccount.userId, { transaction: t })
			
			// Create notifications
			await createNotification(
				Number(fromUserId),
				'International Transfer Sent',
				`You sent ${CURRENCY_SYMBOLS[toCurrency] || toCurrency}${convertedAmount.toFixed(2)} (${amt.toFixed(2)} ${fromCurrency}) to account ${toAccountNumber}. Fee: ৳${feeInBDT.toFixed(2)}.`,
				'TRANSFER',
				t
			)
			
			if (recipientUser) {
				await createNotification(
					recipientAccount.userId,
					'International Transfer Received',
					`You received ${CURRENCY_SYMBOLS[toCurrency] || toCurrency}${convertedAmount.toFixed(2)} from account ${senderAccount.accountNumber}.`,
					'TRANSFER',
					t
				)
			}
			
			return {
				transferId: `INT-${Date.now()}`,
				sentAmount: amt.toFixed(2),
				sentCurrency: fromCurrency,
				receivedAmount: convertedAmount.toFixed(2),
				receivedCurrency: toCurrency,
				fee: feeInBDT.toFixed(2),
				exchangeRate: (EXCHANGE_RATES[toCurrency] / EXCHANGE_RATES[fromCurrency]).toFixed(4),
				senderBalance: senderNewBalance.toFixed(2)
			}
		})
		
		return res.status(201).json({ success: true, ...result })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

export default router

