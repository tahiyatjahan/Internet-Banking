import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { postJson } from '../api'

export default function BankTopup() {
	const { user } = useAuth()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [balance, setBalance] = useState(null)
	const [form, setForm] = useState({ amount: '', bankName: '', accountNumber: '', routingNumber: '' })
	const [confirmedAmount, setConfirmedAmount] = useState(null)

	async function submit() {
		if (!user) {
			setError('Please login first')
			return
		}
		setLoading(true); setError(''); setSuccess('')
		try {
			const res = await postJson('/api/topup/bank', { userId: user.id, ...form })
			setSuccess(`Top-up successful. Txn #${res.transactionId}`)
			setBalance(res.balance)
			setConfirmedAmount(Number(form.amount || 0))
		} catch (e) {
			setError(e.message)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="page">
			{confirmedAmount === null ? (
				<>
					<h2 className="page-title">Add Money - Bank Details</h2>
					<p className="subtitle">Amounts in BDT (৳)</p>
					<div className="form card large-form">
						<div className="field">
							<label>Bank Name</label>
							<input value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} placeholder="BRAC Bank" />
						</div>
						<div className="field">
							<label>Account Number</label>
							<input value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })} placeholder="123456789" />
						</div>
						<div className="field">
							<label>Routing Number</label>
							<input value={form.routingNumber} onChange={e => setForm({ ...form, routingNumber: e.target.value })} placeholder="9-digit routing" />
						</div>
						<div className="field">
							<label>Amount</label>
							<input value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" />
						</div>
						<button disabled={loading} onClick={submit}>{loading ? 'Processing…' : 'Submit'}</button>
						<div className="error">{error}</div>
						<div className="success">{success}</div>
					</div>
				</>
			) : (
				<div className="card confirm">
					<div className="check">
						<svg width="96" height="96" viewBox="0 0 24 24" fill="none">
							<circle cx="12" cy="12" r="10" fill="#dcfce7"/>
							<path d="M7 12l3 3 7-7" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
						</svg>
					</div>
					<h3 className="title" style={{ textAlign: 'center', fontSize: 28, marginTop: 8 }}>Success!</h3>
					<p style={{ textAlign: 'center', margin: '6px 0 16px 0' }}>
						৳{Number(confirmedAmount).toFixed(0)} has been added to your account.
					</p>
					<button onClick={() => { setConfirmedAmount(null); setForm({ amount: '', bankName: '', accountNumber: '', routingNumber: '' }) }}>
						Back
					</button>
					<div className="balance" style={{ textAlign: 'center' }}>Latest balance: {balance ?? '—'} BDT</div>
				</div>
			)}
		</div>
	)
}


