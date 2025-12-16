import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { postJson } from '../api'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:9135'

export default function Investments() {
	const { user } = useAuth()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [investments, setInvestments] = useState([])
	const [form, setForm] = useState({
		businessName: '',
		amount: '',
		monthlyReturnRate: '2.0',
		termMonths: '12'
	})

	useEffect(() => {
		loadInvestments()
	}, [])

	async function loadInvestments() {
		try {
			const token = localStorage.getItem('token')
			const res = await fetch(`${API_BASE}/api/investments`, {
				headers: { Authorization: `Bearer ${token}` }
			})
			const data = await res.json()
			if (data.success) {
				setInvestments(data.investments || [])
			}
		} catch (e) {
			console.error('Failed to load investments:', e)
		}
	}

	async function handleCreate() {
		setLoading(true)
		setError('')
		setSuccess('')
		try {
			await postJson('/api/investments', {
				businessName: form.businessName,
				amount: form.amount,
				monthlyReturnRate: form.monthlyReturnRate,
				termMonths: form.termMonths
			})
			setSuccess('Investment created successfully.')
			setForm({
				businessName: '',
				amount: '',
				monthlyReturnRate: '2.0',
				termMonths: '12'
			})
			await loadInvestments()
		} catch (e) {
			setError(e.message)
		} finally {
			setLoading(false)
		}
	}

	async function handleRedeem(id) {
		setLoading(true)
		setError('')
		setSuccess('')
		try {
			await postJson(`/api/investments/${id}/redeem`, {})
			setSuccess('Investment redeemed and returns credited to your account.')
			await loadInvestments()
		} catch (e) {
			setError(e.message)
		} finally {
			setLoading(false)
		}
	}

	const activeInvestments = investments.filter(inv => inv.status === 'ACTIVE')
	const completedInvestments = investments.filter(inv => inv.status !== 'ACTIVE')

	return (
		<div className="page">
			<div style={{ marginBottom: '20px' }}>
				<h2 className="page-title" style={{ marginBottom: '4px', fontSize: '24px' }}>Business Investments</h2>
				<p className="subtitle" style={{ margin: 0, fontSize: '14px' }}>
					Invest in businesses and earn monthly returns. All amounts are in BDT (৳).
				</p>
			</div>

			<div className="card" style={{ marginBottom: '20px' }}>
				<h3 className="title" style={{ marginBottom: '12px' }}>New Investment</h3>
				<div className="field">
					<label>Business Name</label>
					<input
						value={form.businessName}
						onChange={e => setForm({ ...form, businessName: e.target.value })}
						placeholder="e.g., Local Store Growth Fund"
					/>
				</div>
				<div className="field">
					<label>Amount (BDT)</label>
					<input
						value={form.amount}
						onChange={e => setForm({ ...form, amount: e.target.value })}
						placeholder="5000.00"
					/>
					<small style={{ color: 'var(--muted)', fontSize: '11px' }}>Min: 500, Max: 200,000</small>
				</div>
				<div className="row">
					<div className="field">
						<label>Monthly Return Rate (%)</label>
						<input
							value={form.monthlyReturnRate}
							onChange={e => setForm({ ...form, monthlyReturnRate: e.target.value })}
							placeholder="2.0"
						/>
					</div>
					<div className="field">
						<label>Term (months)</label>
						<input
							value={form.termMonths}
							onChange={e => setForm({ ...form, termMonths: e.target.value })}
							placeholder="12"
						/>
					</div>
				</div>
				<button disabled={loading} onClick={handleCreate}>
					{loading ? 'Processing…' : 'Invest Now'}
				</button>
				<div className="error">{error}</div>
				<div className="success">{success}</div>
			</div>

			{activeInvestments.length > 0 && (
				<div className="card" style={{ marginBottom: '16px' }}>
					<h3 className="title" style={{ marginBottom: '10px' }}>Active Investments</h3>
					<div style={{ fontSize: '14px' }}>
						{activeInvestments.map(inv => (
							<div
								key={inv.id}
								style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}
							>
								<div>
									<div style={{ fontWeight: 600, color: 'var(--white)' }}>{inv.businessName}</div>
									<div style={{ fontSize: '13px', color: 'var(--muted)' }}>
										Amount: ৳{Number(inv.amount).toFixed(2)} • Rate: {Number(inv.monthlyReturnRate).toFixed(2)}% / month • Term: {inv.termMonths} months
									</div>
									<div style={{ fontSize: '12px', color: 'var(--muted)' }}>
										Started: {new Date(inv.created_at || inv.investedAt).toLocaleDateString()}
									</div>
								</div>
								<button
									onClick={() => handleRedeem(inv.id)}
									disabled={loading}
									style={{ width: 'auto', marginTop: 0, padding: '8px 14px' }}
								>
									Redeem
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{completedInvestments.length > 0 && (
				<div className="card">
					<h3 className="title" style={{ marginBottom: '10px' }}>Completed Investments</h3>
					<div style={{ fontSize: '14px' }}>
						{completedInvestments.map(inv => (
							<div
								key={inv.id}
								style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}
							>
								<div style={{ fontWeight: 600, color: 'var(--white)' }}>{inv.businessName}</div>
								<div style={{ fontSize: '13px', color: 'var(--muted)' }}>
									Amount: ৳{Number(inv.amount).toFixed(2)} • Rate: {Number(inv.monthlyReturnRate).toFixed(2)}% / month • Term: {inv.termMonths} months
								</div>
								<div style={{ fontSize: '12px', color: 'var(--muted)' }}>
									Status: {inv.status} • Started: {new Date(inv.created_at || inv.investedAt).toLocaleDateString()}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}


