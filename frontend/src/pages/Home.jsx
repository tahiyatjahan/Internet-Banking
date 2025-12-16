import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:9135'

export default function Home() {
	const { user } = useAuth()
	const navigate = useNavigate()
	const [balance, setBalance] = useState(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		loadSummary()
	}, [user])

	async function loadSummary() {
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
			console.error('Failed to load summary:', e)
		} finally {
			setLoading(false)
		}
	}

	if (loading) {
		return <div className="page">Loading...</div>
	}

	return (
		<div className="page">
			<div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
				<div>
					<h2 className="page-title" style={{ marginBottom: '4px', fontSize: '28px' }}>Dashboard</h2>
					<p className="subtitle" style={{ margin: 0, fontSize: '14px' }}>Welcome back, {user?.fullName || 'User'}</p>
				</div>
			</div>

			<div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '16px', marginBottom: '20px' }}>
				<div
					style={{
						background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 60%, #1d4ed8 100%)',
						borderRadius: '18px',
						padding: '24px 28px',
						color: 'white',
						boxShadow: '0 18px 45px rgba(15, 23, 42, 0.35)',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'flex-end'
					}}
				>
					<div>
						<div style={{ fontSize: '13px', opacity: 0.92, marginBottom: '6px', fontWeight: 500 }}>Total Balance</div>
						<div style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-1px', marginBottom: '6px' }}>
							৳{balance || '0.00'}
						</div>
						<div style={{ fontSize: '12px', opacity: 0.9 }}>Bangladeshi Taka (BDT)</div>
					</div>
					<div style={{ textAlign: 'right' }}>
						<div style={{ fontSize: '12px', marginBottom: '4px', opacity: 0.9 }}>Primary account</div>
						<div
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: '6px',
								padding: '6px 10px',
								borderRadius: '999px',
								background: 'rgba(15, 23, 42, 0.35)',
								fontSize: '11px'
							}}
						>
							<span
								style={{
									width: 8,
									height: 8,
									borderRadius: '50%',
									background: '#22c55e'
								}}
							/>
							<span>Secure & up to date</span>
						</div>
					</div>
				</div>

				<div className="card" style={{ padding: '18px 20px' }}>
					<h3 className="title" style={{ marginBottom: '12px' }}>Quick Actions</h3>
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
						<button
							onClick={() => navigate('/add-money')}
							className="nav-button"
							style={{ width: '100%', justifyContent: 'flex-start' }}
						>
							<div className="nav-button-icon" aria-hidden>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
									<rect x="3" y="4" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
									<path d="M7 11h10M12 8v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
								</svg>
							</div>
							<div className="nav-button-label">Add Money</div>
						</button>
						<button
							onClick={() => navigate('/send-money')}
							className="nav-button"
							style={{ width: '100%', justifyContent: 'flex-start' }}
						>
							<div className="nav-button-icon" aria-hidden>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
									<path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
									<path d="M13 7l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
									<circle cx="7" cy="12" r="2" stroke="currentColor" strokeWidth="2" />
								</svg>
							</div>
							<div className="nav-button-label">Send Money</div>
						</button>
						<button
							onClick={() => navigate('/loans')}
							className="nav-button"
							style={{ width: '100%', justifyContent: 'flex-start' }}
						>
							<div className="nav-button-icon" aria-hidden>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
									<path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
									<circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.3" />
								</svg>
							</div>
							<div className="nav-button-label">Microloans</div>
						</button>
						<button
							onClick={() => navigate('/requests')}
							className="nav-button"
							style={{ width: '100%', justifyContent: 'flex-start' }}
						>
							<div className="nav-button-icon" aria-hidden>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
									<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" />
									<path d="M8 10h8M8 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
								</svg>
							</div>
							<div className="nav-button-label">Money Requests</div>
						</button>
					</div>
				</div>
			</div>

			<div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
				<div className="card">
					<h3 className="title" style={{ marginBottom: '12px' }}>Account Overview</h3>
					<p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>
						Use the quick actions above to add money, send funds, apply for a microloan, or handle money requests. Your recent
						transactions and activity will appear here as we add more analytics.
					</p>
					<div
						style={{
							height: '160px',
							borderRadius: '12px',
							border: '1px dashed var(--border)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							color: 'var(--muted)',
							fontSize: '12px'
						}}
					>
						Analytics and charts coming soon
					</div>
					</div>

				<div className="card">
					<h3 className="title" style={{ marginBottom: '12px' }}>Tips</h3>
					<ul style={{ paddingLeft: '20px', margin: 0, fontSize: '13px', color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
						<li>Use <strong>Add Money</strong> to top up from card, bank or prepaid card.</li>
						<li>Use <strong>Send Money</strong> to transfer directly to any registered account number.</li>
						<li>Use <strong>Money Requests</strong> to request funds and approve or reject incoming requests.</li>
						<li>Check the bell icon on the top-right for live notifications on all account activity.</li>
					</ul>
				</div>
			</div>
		</div>
	)
}



