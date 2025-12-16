import { Router } from 'express'
import { Notification } from '../models.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// Get all notifications for the authenticated user
router.get('/notifications', authenticate, async (req, res) => {
	try {
		const notifications = await Notification.findAll({
			where: { userId: req.user.userId },
			order: [['created_at', 'DESC']],
			limit: 50
		})
		
		return res.json({ success: true, notifications })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

// Mark notification as read
router.post('/notifications/:id/read', authenticate, async (req, res) => {
	try {
		const notificationId = Number(req.params.id)
		const notification = await Notification.findByPk(notificationId)
		
		if (!notification) {
			return res.status(404).json({ success: false, error: 'Notification not found' })
		}
		
		if (notification.userId !== req.user.userId) {
			return res.status(403).json({ success: false, error: 'Unauthorized' })
		}
		
		notification.isRead = true
		await notification.save()
		
		return res.json({ success: true, notification })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

// Mark all notifications as read
router.post('/notifications/read-all', authenticate, async (req, res) => {
	try {
		await Notification.update(
			{ isRead: true },
			{ where: { userId: req.user.userId, isRead: false } }
		)
		
		return res.json({ success: true })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

// Get unread notification count
router.get('/notifications/unread-count', authenticate, async (req, res) => {
	try {
		const count = await Notification.count({
			where: { userId: req.user.userId, isRead: false }
		})
		
		return res.json({ success: true, count })
	} catch (e) {
		return res.status(400).json({ success: false, error: e.message })
	}
})

export default router

