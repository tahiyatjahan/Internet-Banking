import jwt from 'jsonwebtoken'
import { User } from '../models.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function authenticate(req, res, next) {
	try {
		const authHeader = req.headers.authorization
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({ success: false, error: 'No token provided' })
		}
		
		const token = authHeader.substring(7)
		const decoded = jwt.verify(token, JWT_SECRET)
		
		const user = await User.findByPk(decoded.userId)
		if (!user) {
			return res.status(401).json({ success: false, error: 'User not found' })
		}
		
		req.user = { userId: user.id, id: user.id, email: user.email, fullName: user.fullName }
		next()
	} catch (e) {
		return res.status(401).json({ success: false, error: 'Invalid or expired token' })
	}
}


