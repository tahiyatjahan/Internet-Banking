import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:9135'

export default function Profile() {
	const { user, logout, loadUser } = useAuth()
	const navigate = useNavigate()
	const [balance, setBalance] = useState(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (!user) {
			navigate('/login')
			return
		}
		loadBalance()
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

	function handleLogout() {
		logout()
		navigate('/login')
	}

	if (loading) {
		return <div className="page">Loading...</div>
	}

	return (
		<div className="page">
			<div className="profile-header">
				<div>
					<h2 className="page-title">My Profile</h2>
					<p className="subtitle">Welcome back, {user?.fullName}</p>
				</div>
				<button onClick={handleLogout} style={{ width: 'auto', marginTop: 0, padding: '10px 20px' }}>
					Logout
				</button>
			</div>

			<div className="profile-balance-card">
				<div className="label">Account Balance</div>
				<div className="amount">৳{balance || '0.00'}</div>
				<div className="currency">BDT (Bangladeshi Taka)</div>
			</div>

			<div className="card">
				<h3 className="title">Account Information</h3>
				<div style={{ display: 'grid', gap: '20px' }}>
					<div>
						<label>User ID</label>
						<div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--white)', marginTop: '4px' }}>{user?.id}</div>
					</div>
					<div>
						<label>Full Name</label>
						<div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--white)', marginTop: '4px' }}>{user?.fullName}</div>
					</div>
					<div>
						<label>Email</label>
						<div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--white)', marginTop: '4px' }}>{user?.email}</div>
					</div>
				</div>
			</div>

			<div className="card" style={{ marginTop: '24px' }}>
				<h3 className="title">Quick Actions</h3>
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
					<button onClick={() => navigate('/')} style={{ marginTop: 0 }}>
						Add Money (Card)
					</button>
					<button onClick={() => navigate('/bank')} style={{ marginTop: 0 }}>
						Add Money (Bank)
					</button>
					<button onClick={() => navigate('/prepaid')} style={{ marginTop: 0 }}>
						Prepaid Top-up
					</button>
					<button onClick={() => navigate('/loans')} style={{ marginTop: 0 }}>
						Microloans
					</button>
					<button onClick={() => navigate('/requests')} style={{ marginTop: 0 }}>
						Money Requests
					</button>
				</div>
			</div>
		</div>
	)
}

