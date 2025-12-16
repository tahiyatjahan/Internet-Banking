import { Account, Notification, TransactionLimit } from './models.js'

// Users can configure per-transaction and daily limits.
// This helper validates and consumes available limit budget atomically inside a DB transaction.
export async function checkAndConsumeLimit(userId, amount, channel = 'GENERAL', transaction = null) {
	const userIdNum = Number(userId)
	const amt = Number.parseFloat(String(amount))
	if (!Number.isFinite(amt) || amt <= 0) {
		throw new Error('Amount must be positive for limit checks')
	}

	// Read or create the limit row within the transaction scope
	let limit = await TransactionLimit.findOne({ where: { userId: userIdNum }, transaction })
	if (!limit) {
		// No limits configured -> allow everything
		return
	}

	// Per-transaction limit
	if (limit.perTransactionLimit !== null) {
		const perTxCap = Number(limit.perTransactionLimit)
		if (amt > perTxCap) {
			throw new Error(`This ${channel.toLowerCase()} exceeds your per-transaction limit of ৳${perTxCap.toFixed(2)}.`)
		}
	}

	// Daily limit using lightweight counters on the model
	const today = new Date()
	const todayKey = today.toISOString().slice(0, 10) // YYYY-MM-DD

	let usedToday = Number(limit.usedToday || 0)
	if (!limit.lastResetDate || String(limit.lastResetDate) !== todayKey) {
		// New day -> reset counters
		usedToday = 0
		limit.usedToday = '0.00'
		limit.lastResetDate = todayKey
	}

	if (limit.dailyLimit !== null) {
		const dailyCap = Number(limit.dailyLimit)
		if (usedToday + amt > dailyCap) {
			throw new Error(
				`This ${channel.toLowerCase()} would exceed your daily limit of ৳${dailyCap.toFixed(2)}. ` +
				`Used today: ৳${usedToday.toFixed(2)}, Requested: ৳${amt.toFixed(2)}.`
			)
		}
	}

	// Consume budget for this transaction
	const newUsedToday = usedToday + amt
	limit.usedToday = newUsedToday.toFixed(2)
	limit.lastResetDate = todayKey
	await limit.save({ transaction })
}
import { Account, Notification, TransactionLimit } from './models.js'

// Generate a unique 12-digit account number
export async function generateAccountNumber(transaction) {
	let accountNumber
	let exists = true
	let attempts = 0
	
	while (exists && attempts < 10) {
		// Generate 12-digit number (100000000000 to 999999999999)
		const random = Math.floor(Math.random() * 900000000000) + 100000000000
		accountNumber = String(random)
		
		const existing = await Account.findOne({ 
			where: { accountNumber },
			transaction 
		})
		
		exists = !!existing
		attempts++
	}
	
	if (exists) {
		throw new Error('Failed to generate unique account number')
	}
	
	return accountNumber
}

// Create a notification for a user
export async function createNotification(userId, title, message, type = 'GENERAL', transaction = null) {
	const notificationData = {
		userId,
		title,
		message,
		type
	}
	
	if (transaction) {
		return await Notification.create(notificationData, { transaction })
	} else {
		return await Notification.create(notificationData)
	}
}

