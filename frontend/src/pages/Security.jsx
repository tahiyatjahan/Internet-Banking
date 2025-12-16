import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:9135'

export default function Security() {
	const { user } = useAuth()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [form, setForm] = useState({
		dailyLimit: '',
		perTransactionLimit: ''
	})

	useEffect(() => {
		loadLimits()
	}, [])

	async function loadLimits() {
		try {
			const token = localStorage.getItem('token')
			const res = await fetch(`${API_BASE}/api/limits/me`, {
				headers: { Authorization: `Bearer ${token}` }
			})
			const data = await res.json()
			if (data.success && data.limits) {
				setForm({
					dailyLimit: data.limits.dailyLimit ?? '',
					perTransactionLimit: data.limits.perTransactionLimit ?? ''
				})
			}
		} catch (e) {
			console.error('Failed to load limits:', e)
		}
	}

	async function handleSave() {
		setLoading(true)
		setError('')
		setSuccess('')
		try {
			const token = localStorage.getItem('token')
			const res = await fetch(`${API_BASE}/api/limits/me`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					dailyLimit: form.dailyLimit === '' ? null : form.dailyLimit,
					perTransactionLimit: form.perTransactionLimit === '' ? null : form.perTransactionLimit
				})
			})
			const data = await res.json()
			if (!data.success) {
				throw new Error(data.error || 'Failed to update limits')
			}
			setSuccess('Transaction limits updated successfully.')
		} catch (e) {
			setError(e.message)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="page">
			<div style={{ marginBottom: '20px' }}>
				<h2 className="page-title" style={{ marginBottom: '4px', fontSize: '24px' }}>Security & Limits</h2>
				<p className="subtitle" style={{ margin: 0, fontSize: '14px' }}>
					Set transaction limits to protect your account from large or unusual activity.
				</p>
			</div>

			<div className="card">
				<h3 className="title" style={{ marginBottom: '12px' }}>Transaction Limits</h3>
				<p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>
					These limits apply to outgoing transfers, approved money requests, and investments. Leave a field blank to remove that limit.
				</p>

				<div className="field">
					<label>Daily Total Limit (BDT)</label>
					<input
						value={form.dailyLimit}
						onChange={e => setForm({ ...form, dailyLimit: e.target.value })}
						placeholder="e.g., 50000.00"
					/>
					<small style={{ color: 'var(--muted)', fontSize: '11px' }}>
						Maximum total amount you can send or invest per day.
					</small>
				</div>

				<div className="field">
					<label>Per-Transaction Limit (BDT)</label>
					<input
						value={form.perTransactionLimit}
						onChange={e => setForm({ ...form, perTransactionLimit: e.target.value })}
						placeholder="e.g., 10000.00"
					/>
					<small style={{ color: 'var(--muted)', fontSize: '11px' }}>
						Maximum amount allowed for a single transfer, approved request, or investment.
					</small>
				</div>

				<button disabled={loading} onClick={handleSave}>
					{loading ? 'Saving…' : 'Save Limits'}
				</button>
				<div className="error">{error}</div>
				<div className="success">{success}</div>
			</div>
		</div>
	)
}


