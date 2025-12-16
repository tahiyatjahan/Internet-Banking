import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { postJson } from '../api'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:9135'

function useTopup(handler) {
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')

	async function submit() {
		setLoading(true); setError(''); setSuccess('')
		try {
			await handler()
			setSuccess('Top-up successful')
		} catch (e) {
			setError(e.message)
		} finally {
			setLoading(false)
		}
	}

	return { loading, error, success, submit, setError, setSuccess }
}

export default function AddMoney() {
	const { user } = useAuth()
	const navigate = useNavigate()
	const [balance, setBalance] = useState(null)
	const [activeMethod, setActiveMethod] = useState(null) // 'card', 'bank', 'prepaid', or null

	const [cardForm, setCardForm] = useState({ amount: '', cardNumber: '', expiryMonth: '', expiryYear: '', cvv: '' })
	const [bankForm, setBankForm] = useState({ amount: '', bankName: '', accountNumber: '', routingNumber: '' })
	const [prepaidForm, setPrepaidForm] = useState({ amount: '', cardNumber: '', pin: '' })

	useEffect(() => {
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
		}
	}

	const card = useTopup(async () => {
		if (!user) throw new Error('Please login first')
		const res = await postJson('/api/topup/card', { userId: user.id, ...cardForm })
		setBalance(res.balance)
		setCardForm({ amount: '', cardNumber: '', expiryMonth: '', expiryYear: '', cvv: '' })
		setActiveMethod(null)
		loadBalance()
	})
	const bank = useTopup(async () => {
		if (!user) throw new Error('Please login first')
		const res = await postJson('/api/topup/bank', { userId: user.id, ...bankForm })
		setBalance(res.balance)
		setBankForm({ amount: '', bankName: '', accountNumber: '', routingNumber: '' })
		setActiveMethod(null)
		loadBalance()
	})
	const prepaid = useTopup(async () => {
		if (!user) throw new Error('Please login first')
		const res = await postJson('/api/topup/prepaid', { userId: user.id, ...prepaidForm })
		setBalance(res.balance)
		setPrepaidForm({ amount: '', cardNumber: '', pin: '' })
		setActiveMethod(null)
		loadBalance()
	})

	return (
		<div className="page">
			<div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
				<div>
					<h2 className="page-title" style={{ marginBottom: '4px', fontSize: '28px' }}>Dashboard</h2>
					<p className="subtitle" style={{ margin: 0, fontSize: '14px' }}>Welcome back, {user?.fullName || 'User'}</p>
				</div>
				{/* Balance Card - Compact */}
				<div style={{
					background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
					borderRadius: '16px',
					padding: '20px 28px',
					color: 'white',
					boxShadow: '0 4px 20px rgba(59, 130, 246, 0.25)',
					minWidth: '240px',
					textAlign: 'right'
				}}>
					<div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px', fontWeight: '500' }}>
						Balance
					</div>
					<div style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '-0.5px' }}>
						৳{balance || '0.00'}
					</div>
					<div style={{ fontSize: '11px', opacity: 0.8 }}>
						BDT
					</div>
				</div>
			</div>

			{/* Quick Actions - Compact Grid */}
			<div style={{ marginBottom: '20px' }}>
				<h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--white)', marginBottom: '12px' }}>
					Add Money
				</h3>
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
					<button
						onClick={() => setActiveMethod(activeMethod === 'card' ? null : 'card')}
						style={{
							background: activeMethod === 'card' ? 'var(--accent)' : 'var(--card)',
							border: `2px solid ${activeMethod === 'card' ? 'var(--accent)' : 'var(--border)'}`,
							borderRadius: '12px',
							padding: '16px',
							cursor: 'pointer',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: '8px',
							transition: 'all 0.2s',
							color: activeMethod === 'card' ? 'white' : 'var(--white)',
							fontSize: '14px',
							fontWeight: '600'
						}}
						onMouseEnter={e => {
							if (activeMethod !== 'card') {
								e.currentTarget.style.background = '#f0f9ff'
								e.currentTarget.style.borderColor = 'var(--accent)'
							}
						}}
						onMouseLeave={e => {
							if (activeMethod !== 'card') {
								e.currentTarget.style.background = 'var(--card)'
								e.currentTarget.style.borderColor = 'var(--border)'
							}
						}}
					>
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<rect x="3" y="4" width="18" height="14" rx="3"/>
							<path d="M7 11h10M12 8v6" strokeLinecap="round"/>
						</svg>
						<div>Credit/Debit Card</div>
					</button>

					<button
						onClick={() => setActiveMethod(activeMethod === 'bank' ? null : 'bank')}
						style={{
							background: activeMethod === 'bank' ? 'var(--accent)' : 'var(--card)',
							border: `2px solid ${activeMethod === 'bank' ? 'var(--accent)' : 'var(--border)'}`,
							borderRadius: '12px',
							padding: '16px',
							cursor: 'pointer',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: '8px',
							transition: 'all 0.2s',
							color: activeMethod === 'bank' ? 'white' : 'var(--white)',
							fontSize: '14px',
							fontWeight: '600'
						}}
						onMouseEnter={e => {
							if (activeMethod !== 'bank') {
								e.currentTarget.style.background = '#f0f9ff'
								e.currentTarget.style.borderColor = 'var(--accent)'
							}
						}}
						onMouseLeave={e => {
							if (activeMethod !== 'bank') {
								e.currentTarget.style.background = 'var(--card)'
								e.currentTarget.style.borderColor = 'var(--border)'
							}
						}}
					>
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<rect x="2" y="6" width="20" height="12" rx="2"/>
							<path d="M6 10h12M6 14h8"/>
						</svg>
						<div>Bank Transfer</div>
					</button>

					<button
						onClick={() => setActiveMethod(activeMethod === 'prepaid' ? null : 'prepaid')}
						style={{
							background: activeMethod === 'prepaid' ? 'var(--accent)' : 'var(--card)',
							border: `2px solid ${activeMethod === 'prepaid' ? 'var(--accent)' : 'var(--border)'}`,
							borderRadius: '12px',
							padding: '16px',
							cursor: 'pointer',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: '8px',
							transition: 'all 0.2s',
							color: activeMethod === 'prepaid' ? 'white' : 'var(--white)',
							fontSize: '14px',
							fontWeight: '600'
						}}
						onMouseEnter={e => {
							if (activeMethod !== 'prepaid') {
								e.currentTarget.style.background = '#f0f9ff'
								e.currentTarget.style.borderColor = 'var(--accent)'
							}
						}}
						onMouseLeave={e => {
							if (activeMethod !== 'prepaid') {
								e.currentTarget.style.background = 'var(--card)'
								e.currentTarget.style.borderColor = 'var(--border)'
							}
						}}
					>
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<rect x="2" y="4" width="20" height="16" rx="2"/>
							<path d="M2 10h20"/>
						</svg>
						<div>Prepaid Card</div>
					</button>
				</div>
			</div>

			{/* Quick Links - Compact */}
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
				<button
					onClick={() => navigate('/loans')}
					style={{
						background: 'var(--card)',
						border: '1px solid var(--border)',
						borderRadius: '10px',
						padding: '12px 14px',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '10px',
						transition: 'all 0.2s',
						color: 'var(--white)',
						fontSize: '13px',
						fontWeight: '500'
					}}
					onMouseEnter={e => {
						e.currentTarget.style.background = '#f0f9ff'
						e.currentTarget.style.borderColor = 'var(--accent)'
						e.currentTarget.style.transform = 'translateY(-2px)'
					}}
					onMouseLeave={e => {
						e.currentTarget.style.background = 'var(--card)'
						e.currentTarget.style.borderColor = 'var(--border)'
						e.currentTarget.style.transform = 'translateY(0)'
					}}
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
						<path d="M12 2v20M2 12h20" strokeLinecap="round"/>
						<circle cx="12" cy="12" r="3" fill="var(--accent)" fillOpacity="0.3"/>
					</svg>
					<span>Microloans</span>
				</button>

				<button
					onClick={() => navigate('/requests')}
					style={{
						background: 'var(--card)',
						border: '1px solid var(--border)',
						borderRadius: '10px',
						padding: '12px 14px',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '10px',
						transition: 'all 0.2s',
						color: 'var(--white)',
						fontSize: '13px',
						fontWeight: '500'
					}}
					onMouseEnter={e => {
						e.currentTarget.style.background = '#f0f9ff'
						e.currentTarget.style.borderColor = 'var(--accent)'
						e.currentTarget.style.transform = 'translateY(-2px)'
					}}
					onMouseLeave={e => {
						e.currentTarget.style.background = 'var(--card)'
						e.currentTarget.style.borderColor = 'var(--border)'
						e.currentTarget.style.transform = 'translateY(0)'
					}}
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
						<path d="M8 10h8M8 14h6" strokeLinecap="round"/>
					</svg>
					<span>Money Requests</span>
				</button>

				<button
					onClick={() => navigate('/international')}
					style={{
						background: 'var(--card)',
						border: '1px solid var(--border)',
						borderRadius: '10px',
						padding: '12px 14px',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '10px',
						transition: 'all 0.2s',
						color: 'var(--white)',
						fontSize: '13px',
						fontWeight: '500'
					}}
					onMouseEnter={e => {
						e.currentTarget.style.background = '#f0f9ff'
						e.currentTarget.style.borderColor = 'var(--accent)'
						e.currentTarget.style.transform = 'translateY(-2px)'
					}}
					onMouseLeave={e => {
						e.currentTarget.style.background = 'var(--card)'
						e.currentTarget.style.borderColor = 'var(--border)'
						e.currentTarget.style.transform = 'translateY(0)'
					}}
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
						<circle cx="12" cy="12" r="10"/>
						<path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
					</svg>
					<span>International</span>
				</button>
			</div>

			{/* Form Cards - Show based on active method */}
			{activeMethod === 'card' && (
				<div className="card" style={{ animation: 'fade 0.3s ease' }}>
					<h3 className="title">Add Money via Card</h3>
					<div className="field">
						<label>Card Number</label>
						<input value={cardForm.cardNumber} onChange={e => setCardForm({ ...cardForm, cardNumber: e.target.value })} placeholder="1234 5678 9012 3456" />
					</div>
					<div className="row">
						<div className="field">
							<label>Expiry (MM)</label>
							<input value={cardForm.expiryMonth} onChange={e => setCardForm({ ...cardForm, expiryMonth: e.target.value })} placeholder="12" />
						</div>
						<div className="field">
							<label>Expiry (YY)</label>
							<input value={cardForm.expiryYear} onChange={e => setCardForm({ ...cardForm, expiryYear: e.target.value })} placeholder="30" />
						</div>
						<div className="field">
							<label>CVV</label>
							<input value={cardForm.cvv} onChange={e => setCardForm({ ...cardForm, cvv: e.target.value })} placeholder="123" />
						</div>
					</div>
					<div className="field">
						<label>Amount (BDT)</label>
						<input value={cardForm.amount} onChange={e => setCardForm({ ...cardForm, amount: e.target.value })} placeholder="1000.00" />
					</div>
					<button disabled={card.loading} onClick={card.submit}>{card.loading ? 'Processing…' : 'Add Money'}</button>
					<div className="error">{card.error}</div>
					<div className="success">{card.success}</div>
				</div>
			)}

			{activeMethod === 'bank' && (
				<div className="card" style={{ animation: 'fade 0.3s ease' }}>
					<h3 className="title">Add Money via Bank Transfer</h3>
					<div className="field">
						<label>Bank Name</label>
						<input value={bankForm.bankName} onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })} placeholder="BRAC Bank" />
					</div>
					<div className="field">
						<label>Account Number</label>
						<input value={bankForm.accountNumber} onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value })} placeholder="123456789" />
					</div>
					<div className="field">
						<label>Routing Number</label>
						<input value={bankForm.routingNumber} onChange={e => setBankForm({ ...bankForm, routingNumber: e.target.value })} placeholder="9-digit routing" />
					</div>
					<div className="field">
						<label>Amount (BDT)</label>
						<input value={bankForm.amount} onChange={e => setBankForm({ ...bankForm, amount: e.target.value })} placeholder="1000.00" />
					</div>
					<button disabled={bank.loading} onClick={bank.submit}>{bank.loading ? 'Processing…' : 'Add Money'}</button>
					<div className="error">{bank.error}</div>
					<div className="success">{bank.success}</div>
				</div>
			)}

			{activeMethod === 'prepaid' && (
				<div className="card" style={{ animation: 'fade 0.3s ease' }}>
					<h3 className="title">Add Money via Prepaid Card</h3>
					<div className="field">
						<label>Amount (BDT)</label>
						<input value={prepaidForm.amount} onChange={e => setPrepaidForm({ ...prepaidForm, amount: e.target.value })} placeholder="1000.00" />
					</div>
					<div className="field">
						<label>Card Number</label>
						<input value={prepaidForm.cardNumber} onChange={e => setPrepaidForm({ ...prepaidForm, cardNumber: e.target.value })} placeholder="1234567890123456" />
					</div>
					<div className="field">
						<label>PIN</label>
						<input
							type="password"
							value={prepaidForm.pin}
							onChange={e => setPrepaidForm({ ...prepaidForm, pin: e.target.value })}
							placeholder="1234"
						/>
					</div>
					<button disabled={prepaid.loading} onClick={prepaid.submit}>{prepaid.loading ? 'Processing…' : 'Add Money'}</button>
					<div className="error">{prepaid.error}</div>
					<div className="success">{prepaid.success}</div>
				</div>
			)}
		</div>
	)
}
