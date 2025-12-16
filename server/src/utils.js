import { Account, Notification } from './models.js'

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

