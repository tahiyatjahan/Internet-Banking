import { useState } from 'react'
import { postJson } from './api'

function useTopup() {
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [balance, setBalance] = useState(null)

	async function submit(path, payload) {
		setLoading(true)
		setError('')
		setSuccess('')
		try {
			const res = await postJson(path, payload)
			setSuccess(`Top-up successful. Txn #${res.transactionId}`)
			setBalance(res.balance)
		} catch (e) {
			setError(e.message)
		} finally {
			setLoading(false)
		}
	}
	return { loading, error, success, balance, submit }
}

export default function App() {
	const [userId, setUserId] = useState(1)
	const card = useTopup()
	const bank = useTopup()

	const [cardForm, setCardForm] = useState({
		amount: '',
		cardNumber: '',
		expiryMonth: '',
		expiryYear: '',
		cvv: ''
	})
	const [bankForm, setBankForm] = useState({
		amount: '',
		bankName: '',
		accountNumber: '',
		routingNumber: ''
	})

	return (
		<div className="container">
			<h2>Internet Banking - Top up</h2>
			<div className="balance">Current balance (last result): {card.balance || bank.balance || '—'}</div>
			<div className="field" style={{ maxWidth: 240, marginTop: 12 }}>
				<label>User ID</label>
				<input value={userId} onChange={e => setUserId(Number(e.target.value || 0))} placeholder="1" />
			</div>

			<div className="grid" style={{ marginTop: 12 }}>
				<div className="card">
					<h3 className="title">Add money from card</h3>
					<div className="field">
						<label>Amount (USD)</label>
						<input value={cardForm.amount} onChange={e => setCardForm({ ...cardForm, amount: e.target.value })} placeholder="100.00" />
					</div>
					<div className="field">
						<label>Card number</label>
						<input value={cardForm.cardNumber} onChange={e => setCardForm({ ...cardForm, cardNumber: e.target.value })} placeholder="4111111111111111" />
					</div>
					<div className="row">
						<div className="field">
							<label>Expiry month</label>
							<input value={cardForm.expiryMonth} onChange={e => setCardForm({ ...cardForm, expiryMonth: e.target.value })} placeholder="12" />
						</div>
						<div className="field">
							<label>Expiry year</label>
							<input value={cardForm.expiryYear} onChange={e => setCardForm({ ...cardForm, expiryYear: e.target.value })} placeholder="2030" />
						</div>
					</div>
					<div className="field">
						<label>CVV</label>
						<input value={cardForm.cvv} onChange={e => setCardForm({ ...cardForm, cvv: e.target.value })} placeholder="123" />
					</div>
					<button disabled={card.loading} onClick={() => card.submit('/api/topup/card', { userId, ...cardForm })}>
						{card.loading ? 'Processing…' : 'Top up by card'}
					</button>
					<div className="error">{card.error}</div>
					<div className="success">{card.success}</div>
				</div>

				<div className="card">
					<h3 className="title">Add money from bank</h3>
					<div className="field">
						<label>Amount (USD)</label>
						<input value={bankForm.amount} onChange={e => setBankForm({ ...bankForm, amount: e.target.value })} placeholder="100.00" />
					</div>
					<div className="field">
						<label>Bank name</label>
						<input value={bankForm.bankName} onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })} placeholder="Chase" />
					</div>
					<div className="field">
						<label>Account number</label>
						<input value={bankForm.accountNumber} onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value })} placeholder="123456789" />
					</div>
					<div className="field">
						<label>Routing number</label>
						<input value={bankForm.routingNumber} onChange={e => setBankForm({ ...bankForm, routingNumber: e.target.value })} placeholder="021000021" />
					</div>
					<button disabled={bank.loading} onClick={() => bank.submit('/api/topup/bank', { userId, ...bankForm })}>
						{bank.loading ? 'Processing…' : 'Top up by bank'}
					</button>
					<div className="error">{bank.error}</div>
					<div className="success">{bank.success}</div>
				</div>
			</div>
		</div>
	)
}


