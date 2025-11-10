import { useState } from 'react'
import { postJson } from '../api'

export default function BankTopup() {
	const [userId, setUserId] = useState(1)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [balance, setBalance] = useState(null)
	const [form, setForm] = useState({ amount: '', bankName: '', accountNumber: '', routingNumber: '' })

	async function submit() {
		setLoading(true); setError(''); setSuccess('')
		try {
			const res = await postJson('/api/topup/bank', { userId, ...form })
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
			<h2 className="page-title">Add money from bank</h2>
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
					<label>Bank name</label>
					<input value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} placeholder="BRAC Bank" />
				</div>
				<div className="field">
					<label>Account number</label>
					<input value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })} placeholder="123456789" />
				</div>
				<div className="field">
					<label>Routing number</label>
					<input value={form.routingNumber} onChange={e => setForm({ ...form, routingNumber: e.target.value })} placeholder="9-digit routing" />
				</div>
				<button disabled={loading} onClick={submit}>{loading ? 'Processing…' : 'Top up (Bank)'}</button>
				<div className="error">{error}</div>
				<div className="success">{success}</div>
			</div>
		</div>
	)
}


