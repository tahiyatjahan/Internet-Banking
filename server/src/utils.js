import { Account, Notification, TransactionLimit, LimitOTP, User } from './models.js'
import nodemailer from 'nodemailer'

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

// Generate a 6-digit OTP
function generateOTP() {
	return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send OTP email using nodemailer
export async function sendOTPEmail(email, otp) {
	try {
		// For development, we'll use a simple console log
		// In production, configure SMTP settings via environment variables
		const SMTP_HOST = process.env.SMTP_HOST
		const SMTP_PORT = process.env.SMTP_PORT || 587
		const SMTP_USER = process.env.SMTP_USER
		const SMTP_PASS = process.env.SMTP_PASS
		const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER

		// If SMTP is not configured, log to console (for development)
		if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
			console.log('\n=== OTP Email (Dev Mode) ===')
			console.log(`To: ${email}`)
			console.log(`Subject: Transaction Limit Change - OTP Verification`)
			console.log(`OTP: ${otp}`)
			console.log('==========================\n')
			return true
		}

		const transporter = nodemailer.createTransport({
			host: SMTP_HOST,
			port: Number(SMTP_PORT),
			secure: SMTP_PORT == 465,
			auth: {
				user: SMTP_USER,
				pass: SMTP_PASS
			}
		})

		const mailOptions = {
			from: SMTP_FROM,
			to: email,
			subject: 'Transaction Limit Change - OTP Verification',
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #2563eb;">Transaction Limit Change Request</h2>
					<p>You have requested to change your transaction limits. Use the following OTP to verify your request:</p>
					<div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
						<h1 style="color: #2563eb; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
					</div>
					<p style="color: #6b7280; font-size: 14px;">This OTP will expire in 10 minutes. If you did not request this change, please ignore this email.</p>
				</div>
			`
		}

		await transporter.sendMail(mailOptions)
		return true
	} catch (error) {
		console.error('Failed to send OTP email:', error)
		throw new Error('Failed to send OTP email')
	}
}

// Generate and send OTP for transaction limit changes
export async function generateAndSendLimitOTP(userId, transaction = null) {
	const user = await User.findByPk(Number(userId), { transaction })
	if (!user) throw new Error('User not found')
	if (!user.email) throw new Error('User email not found')

	// Delete any existing unused OTPs for this user
	await LimitOTP.destroy({
		where: {
			userId: Number(userId),
			used: false
		},
		transaction
	})

	// Generate new OTP
	const otp = generateOTP()
	const expiresAt = new Date()
	expiresAt.setMinutes(expiresAt.getMinutes() + 10) // OTP expires in 10 minutes

	// Save OTP to database
	await LimitOTP.create(
		{
			userId: Number(userId),
			otp,
			expiresAt,
			used: false
		},
		{ transaction }
	)

	// Send email
	await sendOTPEmail(user.email, otp)

	return otp // Return OTP so it can be included in response for dev mode
}

// Verify OTP for transaction limit changes
export async function verifyLimitOTP(userId, otp, transaction = null) {
	const otpRecord = await LimitOTP.findOne({
		where: {
			userId: Number(userId),
			otp: String(otp),
			used: false
		},
		transaction
	})

	if (!otpRecord) {
		throw new Error('Invalid or expired OTP')
	}

	if (new Date() > new Date(otpRecord.expiresAt)) {
		throw new Error('OTP has expired')
	}

	// Mark OTP as used
	otpRecord.used = true
	await otpRecord.save({ transaction })

	return true
}

