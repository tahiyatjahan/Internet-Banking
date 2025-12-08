import { useState } from 'react'
import { postJson } from '../api'

export default function PrepaidTopup() {
	const [userId, setUserId] = useState(1)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [balance, setBalance] = useState(null)
	const [form, setForm] = useState({ amount: '', cardNumber: '', pin: '' })

	async function submit() {
		setLoading(true); setError(''); setSuccess('')
		try {
			const res = await postJson('/api/topup/prepaid', { userId, ...form })
			setSuccess(`Top-up successful. Txn #${res.transactionId}`)
			setBalance(res.balance)
			setForm({ amount: '', cardNumber: '', pin: '' })
		} catch (e) {
			setError(e.message)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="page">
			<h2 className="page-title">Add money from prepaid/gift card</h2>
			<p className="subtitle">All amounts are in BDT (৳).</p>
			<div className="balance">Latest balance result: {balance ?? '—'} BDT</div>
			<div className="form card">
				<div className="field" style={{ maxWidth: 240 }}>
					<label>User ID</label>
					<input value={userId} onChange={e => setUserId(Number(e.target.value || 0))} placeholder="1" />
				</div>
				<div className="field">
					<label>Amount (BDT)</label>
					<input value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="1000.00" />
				</div>
				<div className="field">
					<label>Card number</label>
					<input value={form.cardNumber} onChange={e => setForm({ ...form, cardNumber: e.target.value })} placeholder="1234567890123456" />
				</div>
				<div className="field">
					<label>PIN</label>
					<input 
						type="password"
						value={form.pin} 
						onChange={e => setForm({ ...form, pin: e.target.value })} 
						placeholder="1234" 
					/>
					<small style={{ color: 'var(--muted)', fontSize: '11px' }}>4-6 digit PIN</small>
				</div>
				<button disabled={loading} onClick={submit}>{loading ? 'Processing…' : 'Top up (Prepaid/Gift Card)'}</button>
				<div className="error">{error}</div>
				<div className="success">{success}</div>
			</div>
		</div>
	)
}

