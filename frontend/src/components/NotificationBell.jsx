import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:9135'

export default function NotificationBell() {
	const { user } = useAuth()
	const [notifications, setNotifications] = useState([])
	const [unreadCount, setUnreadCount] = useState(0)
	const [isOpen, setIsOpen] = useState(false)
	const dropdownRef = useRef(null)

	useEffect(() => {
		if (user) {
			loadNotifications()
			loadUnreadCount()
			// Refresh every 10 seconds
			const interval = setInterval(() => {
				loadNotifications()
				loadUnreadCount()
			}, 10000)
			return () => clearInterval(interval)
		}
	}, [user])

	useEffect(() => {
		function handleClickOutside(event) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	async function loadNotifications() {
		if (!user) return
		try {
			const token = localStorage.getItem('token')
			const res = await fetch(`${API_BASE}/api/notifications`, {
				headers: { Authorization: `Bearer ${token}` }
			})
			const data = await res.json()
			if (data.success) {
				setNotifications(data.notifications || [])
			}
		} catch (e) {
			console.error('Failed to load notifications:', e)
		}
	}

	async function loadUnreadCount() {
		if (!user) return
		try {
			const token = localStorage.getItem('token')
			const res = await fetch(`${API_BASE}/api/notifications/unread-count`, {
				headers: { Authorization: `Bearer ${token}` }
			})
			const data = await res.json()
			if (data.success) {
				setUnreadCount(data.count || 0)
			}
		} catch (e) {
			console.error('Failed to load unread count:', e)
		}
	}

	async function markAsRead(notificationId) {
		try {
			const token = localStorage.getItem('token')
			await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` }
			})
			loadNotifications()
			loadUnreadCount()
		} catch (e) {
			console.error('Failed to mark as read:', e)
		}
	}

	async function markAllAsRead() {
		try {
			const token = localStorage.getItem('token')
			await fetch(`${API_BASE}/api/notifications/read-all`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` }
			})
			loadNotifications()
			loadUnreadCount()
		} catch (e) {
			console.error('Failed to mark all as read:', e)
		}
	}

	function getNotificationIcon(type) {
		switch (type) {
			case 'TOPUP':
				return '💰'
			case 'TRANSFER':
				return '💸'
			case 'LOAN':
				return '📋'
			case 'REQUEST':
				return '📨'
			default:
				return '🔔'
		}
	}

	if (!user) return null

	return (
		<div style={{ position: 'relative' }} ref={dropdownRef}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				style={{
					position: 'relative',
					background: 'transparent',
					border: 'none',
					cursor: 'pointer',
					padding: '8px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					color: 'var(--white)'
				}}
			>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
					<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
					<path d="M13.73 21a2 2 0 0 1-3.46 0" />
				</svg>
				{unreadCount > 0 && (
					<span style={{
						position: 'absolute',
						top: '4px',
						right: '4px',
						background: '#ef4444',
						color: 'white',
						borderRadius: '10px',
						padding: '2px 6px',
						fontSize: '10px',
						fontWeight: 'bold',
						minWidth: '18px',
						textAlign: 'center'
					}}>
						{unreadCount > 9 ? '9+' : unreadCount}
					</span>
				)}
			</button>

			{isOpen && (
				<div style={{
					position: 'absolute',
					top: '100%',
					right: 0,
					marginTop: '8px',
					width: '360px',
					maxHeight: '500px',
					background: '#ffffff',
					border: '1px solid var(--border)',
					borderRadius: '12px',
					boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
					overflow: 'hidden',
					zIndex: 1000
				}}>
					<div style={{
						padding: '16px',
						borderBottom: '1px solid var(--border)',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center'
					}}>
						<h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
							Notifications
						</h3>
						{unreadCount > 0 && (
							<button
								onClick={markAllAsRead}
								style={{
									background: 'transparent',
									border: 'none',
									color: 'var(--accent)',
									cursor: 'pointer',
									fontSize: '12px',
									padding: '4px 8px'
								}}
							>
								Mark all as read
							</button>
						)}
					</div>
					<div style={{ maxHeight: '400px', overflowY: 'auto' }}>
						{notifications.length === 0 ? (
							<div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
								No notifications
							</div>
						) : (
							notifications.map(notif => (
								<div
									key={notif.id}
									onClick={() => !notif.isRead && markAsRead(notif.id)}
									style={{
										padding: '12px 16px',
										borderBottom: '1px solid var(--border)',
										cursor: notif.isRead ? 'default' : 'pointer',
										background: notif.isRead ? 'transparent' : '#f0f9ff',
										transition: 'background 0.2s'
									}}
									onMouseEnter={e => {
										if (!notif.isRead) e.currentTarget.style.background = '#e0f2fe'
									}}
									onMouseLeave={e => {
										if (!notif.isRead) e.currentTarget.style.background = '#f0f9ff'
									}}
								>
									<div style={{ display: 'flex', gap: '12px' }}>
										<div style={{ fontSize: '20px', flexShrink: 0 }}>
											{getNotificationIcon(notif.type)}
										</div>
										<div style={{ flex: 1, minWidth: 0 }}>
											<div style={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'flex-start',
												marginBottom: '4px'
											}}>
												<h4 style={{
													margin: 0,
													fontSize: '14px',
													fontWeight: notif.isRead ? '500' : '600',
													color: '#0f172a'
												}}>
													{notif.title}
												</h4>
												{!notif.isRead && (
													<div style={{
														width: '8px',
														height: '8px',
														borderRadius: '50%',
														background: 'var(--accent)',
														flexShrink: 0,
														marginTop: '4px'
													}} />
												)}
											</div>
											<p style={{
												margin: 0,
												fontSize: '13px',
												color: '#64748b',
												lineHeight: '1.4'
											}}>
												{notif.message}
											</p>
											<small style={{
												display: 'block',
												marginTop: '6px',
												fontSize: '11px',
												color: '#94a3b8'
											}}>
												{new Date(notif.created_at).toLocaleString()}
											</small>
										</div>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			)}
		</div>
	)
}

