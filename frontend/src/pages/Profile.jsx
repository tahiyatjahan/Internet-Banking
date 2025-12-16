import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:9135'

export default function Profile() {
	const { user, logout, loadUser } = useAuth()
	const navigate = useNavigate()
	const [balance, setBalance] = useState(null)
	const [loading, setLoading] = useState(true)
	const [isEditing, setIsEditing] = useState(false)
	const [formData, setFormData] = useState({ fullName: '', email: '' })
	const [saveLoading, setSaveLoading] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')

	const currencySymbol = (code) => {
		const map = {
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
			CNY: '¥'
		}
		return map[code] || ''
	}

	useEffect(() => {
		if (!user) {
			navigate('/login')
			return
		}
		loadBalance()
		setFormData({
			fullName: user.fullName || '',
			email: user.email || ''
		})
	}, [user])

	async function loadBalance() {
		try {
			const token = localStorage.getItem('token')
			const res = await fetch(`${API_BASE}/api/auth/me`, {
				headers: { Authorization: `Bearer ${token}` }
			})
			const data = await res.json()
			if (data.success) {
				setBalance(data.user.balance)
			}
		} catch (e) {
			console.error('Failed to load balance:', e)
		} finally {
			setLoading(false)
		}
	}

	async function handleSave() {
		setSaveLoading(true)
		setError('')
		setSuccess('')
		
		try {
			const token = localStorage.getItem('token')
			const res = await fetch(`${API_BASE}/api/auth/me`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(formData)
			})
			
			const data = await res.json()
			if (data.success) {
				setSuccess('Profile updated successfully!')
				setIsEditing(false)
				await loadUser() // Refresh user data in context
				setTimeout(() => setSuccess(''), 3000)
			} else {
				setError(data.error || 'Failed to update profile')
			}
		} catch (e) {
			setError('Failed to update profile')
		} finally {
			setSaveLoading(false)
		}
	}

	function handleCancel() {
		setIsEditing(false)
		setFormData({
			fullName: user.fullName || '',
			email: user.email || ''
		})
		setError('')
		setSuccess('')
	}

	function handleLogout() {
		logout()
		navigate('/login')
	}

	if (loading) {
		return <div className="page">Loading...</div>
	}

	return (
		<div className="page">
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
				<div>
					<h2 className="page-title" style={{ marginBottom: '4px', fontSize: '28px' }}>My Profile</h2>
					<p className="subtitle" style={{ margin: 0, fontSize: '14px' }}>Manage your account information</p>
				</div>
				{!isEditing ? (
					<button 
						onClick={() => setIsEditing(true)}
						style={{ 
							width: 'auto', 
							marginTop: 0, 
							padding: '10px 20px',
							display: 'flex',
							alignItems: 'center',
							gap: '8px'
						}}
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
							<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
						</svg>
						Edit Profile
					</button>
				) : (
					<div style={{ display: 'flex', gap: '10px' }}>
						<button 
							onClick={handleCancel}
							disabled={saveLoading}
							style={{ 
								width: 'auto', 
								marginTop: 0, 
								padding: '10px 20px',
								background: '#64748b',
								border: 'none'
							}}
						>
							Cancel
						</button>
						<button 
							onClick={handleSave}
							disabled={saveLoading}
							style={{ 
								width: 'auto', 
								marginTop: 0, 
								padding: '10px 20px'
							}}
						>
							{saveLoading ? 'Saving...' : 'Save Changes'}
						</button>
					</div>
				)}
			</div>

			{/* Balance Card */}
			<div style={{
				background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
				borderRadius: '16px',
				padding: '24px',
				marginBottom: '24px',
				color: 'white',
				boxShadow: '0 4px 20px rgba(59, 130, 246, 0.25)'
			}}>
				<div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '6px', fontWeight: '500' }}>
					Account Balance
				</div>
				<div style={{ fontSize: '40px', fontWeight: '700', letterSpacing: '-1px', marginBottom: '4px' }}>
					{currencySymbol(user?.currency)}{balance || '0.00'}
				</div>
				<div style={{ fontSize: '13px', opacity: 0.9 }}>
					{user?.currency || 'BDT'}
				</div>
			</div>

			{/* Account Information */}
			<div className="card">
				<h3 className="title" style={{ marginBottom: '20px' }}>Account Information</h3>
				
				{error && <div className="error" style={{ marginBottom: '16px' }}>{error}</div>}
				{success && <div className="success" style={{ marginBottom: '16px' }}>{success}</div>}
				
				<div style={{ display: 'grid', gap: '24px' }}>
					<div>
						<label>Account Number</label>
						<div style={{ 
							fontSize: '18px', 
							fontWeight: '600', 
							color: 'var(--white)', 
							marginTop: '8px',
							padding: '12px',
							background: '#f8fafc',
							borderRadius: '8px',
							border: '1px solid var(--border)',
							fontFamily: 'monospace',
							letterSpacing: '1px'
						}}>
							{user?.accountNumber || 'N/A'}
						</div>
						<div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>
							Your unique account identifier
						</div>
					</div>
					
					<div>
						<label>Account Currency</label>
						<div style={{ 
							fontSize: '16px', 
							fontWeight: '600', 
							color: 'var(--white)', 
							marginTop: '8px',
							padding: '10px 12px',
							background: '#f8fafc',
							borderRadius: '8px',
							border: '1px solid var(--border)'
						}}>
							{user?.currency || 'BDT'}
						</div>
						<div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>
							Choose BDT for local or USD for international at signup
						</div>
					</div>
					
					<div>
						<label>Full Name</label>
						{isEditing ? (
							<input
								type="text"
								value={formData.fullName}
								onChange={e => setFormData({ ...formData, fullName: e.target.value })}
								placeholder="Enter your full name"
								style={{ marginTop: '8px', width: '100%' }}
							/>
						) : (
							<div style={{ 
								fontSize: '16px', 
								fontWeight: '500', 
								color: 'var(--white)', 
								marginTop: '8px',
								padding: '12px',
								background: '#f8fafc',
								borderRadius: '8px',
								border: '1px solid var(--border)'
							}}>
								{user?.fullName || 'N/A'}
							</div>
						)}
					</div>
					
					<div>
						<label>Email</label>
						{isEditing ? (
							<input
								type="email"
								value={formData.email}
								onChange={e => setFormData({ ...formData, email: e.target.value })}
								placeholder="Enter your email"
								style={{ marginTop: '8px', width: '100%' }}
							/>
						) : (
							<div style={{ 
								fontSize: '16px', 
								fontWeight: '500', 
								color: 'var(--white)', 
								marginTop: '8px',
								padding: '12px',
								background: '#f8fafc',
								borderRadius: '8px',
								border: '1px solid var(--border)'
							}}>
								{user?.email || 'N/A'}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Logout Button */}
			<div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
				<button 
					onClick={handleLogout}
					disabled={isEditing}
					style={{ 
						width: 'auto', 
						marginTop: 0, 
						padding: '10px 20px',
						background: 'var(--danger)',
						border: 'none'
					}}
				>
					Logout
				</button>
			</div>
		</div>
	)
}
