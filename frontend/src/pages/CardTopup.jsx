import { useState } from 'react'
import { postJson } from '../api'

export default function CardTopup() {
	const [userId, setUserId] = useState(1)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [balance, setBalance] = useState(null)
	const [form, setForm] = useState({ amount: '', cardNumber: '', expiryMonth: '', expiryYear: '', cvv: '' })

	async function submit() {
		setLoading(true); setError(''); setSuccess('')
		try {
			const res = await postJson('/api/topup/card', { userId, ...form })
			setSuccess(`Top-up successful. Txn #${res.transactionId}`)
			setBalance(res.balance)
		} catch (e) {
			setError(e.message)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="page">
			<h2 className="page-title">Add money from card</h2>
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
					<input value={form.cardNumber} onChange={e => setForm({ ...form, cardNumber: e.target.value })} placeholder="4111111111111111" />
				</div>
				<div className="row">
					<div className="field">
						<label>Expiry month</label>
						<input value={form.expiryMonth} onChange={e => setForm({ ...form, expiryMonth: e.target.value })} placeholder="12" />
					</div>
					<div className="field">
						<label>Expiry year</label>
						<input value={form.expiryYear} onChange={e => setForm({ ...form, expiryYear: e.target.value })} placeholder="2030" />
					</div>
				</div>
				<div className="field">
					<label>CVV</label>
					<input value={form.cvv} onChange={e => setForm({ ...form, cvv: e.target.value })} placeholder="123" />
				</div>
				<button disabled={loading} onClick={submit}>{loading ? 'Processing…' : 'Top up (Card)'}</button>
				<div className="error">{error}</div>
				<div className="success">{success}</div>
			</div>
		</div>
	)
}


