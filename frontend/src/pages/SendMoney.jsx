import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { postJson } from '../api'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:9135'

export default function SendMoney() {
	const { user } = useAuth()
	const [payees, setPayees] = useState([])
	const [transferStatus, setTransferStatus] = useState({ loading: false, error: '', success: '' })
	const [payeeStatus, setPayeeStatus] = useState({ loading: false, error: '', success: '' })
	const [transferForm, setTransferForm] = useState({ toAccountNumber: '', amount: '', note: '', selectedPayee: '' })
	const [payeeForm, setPayeeForm] = useState({ accountNumber: '', nickname: '' })

	useEffect(() => {
		loadPayees()
	}, [user])

	async function loadPayees() {
		if (!user) return
		try {
			const token = localStorage.getItem('token')
			const res = await fetch(`${API_BASE}/api/payees/${user.id}`, {
				headers: { Authorization: `Bearer ${token}` }
			})
			const data = await res.json()
			if (data.success) {
				setPayees(data.payees || [])
			}
		} catch (e) {
			console.error('Failed to load payees:', e)
		}
	}

	async function handleSendMoney() {
		if (!user) return setTransferStatus({ loading: false, error: 'Please login first', success: '' })
		setTransferStatus({ loading: true, error: '', success: '' })
		try {
			await postJson('/api/transfers/send', {
				fromUserId: user.id,
				toAccountNumber: transferForm.toAccountNumber,
				amount: transferForm.amount,
				note: transferForm.note
			})
			setTransferStatus({ loading: false, error: '', success: 'Transfer successful' })
			setTransferForm({ toAccountNumber: '', amount: '', note: '', selectedPayee: '' })
		} catch (e) {
			setTransferStatus({ loading: false, error: e.message, success: '' })
		}
	}

	async function handleSavePayee() {
		if (!user) return setPayeeStatus({ loading: false, error: 'Please login first', success: '' })
		setPayeeStatus({ loading: true, error: '', success: '' })
		try {
			await postJson('/api/payees', {
				userId: user.id,
				accountNumber: payeeForm.accountNumber,
				nickname: payeeForm.nickname
			})
			setPayeeStatus({ loading: false, error: '', success: 'Payee saved' })
			setPayeeForm({ accountNumber: '', nickname: '' })
			loadPayees()
		} catch (e) {
			setPayeeStatus({ loading: false, error: e.message, success: '' })
		}
	}

	function applyPayeeSelection(payeeId) {
		setTransferForm((prev) => {
			const selected = payees.find(p => String(p.id) === String(payeeId))
			return {
				...prev,
				selectedPayee: payeeId,
				toAccountNumber: selected ? selected.payeeAccountNumber : prev.toAccountNumber
			}
		})
	}

	return (
		<div className="page">
			<div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
				<div>
					<h2 className="page-title" style={{ marginBottom: '4px', fontSize: '28px' }}>Send Money</h2>
					<p className="subtitle" style={{ margin: 0, fontSize: '14px' }}>Transfer to any registered account</p>
				</div>
			</div>

			<div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', alignItems: 'stretch' }}>
				<div className="card">
					<h3 className="title" style={{ marginBottom: '12px' }}>Transfer</h3>
					<div className="field">
						<label>Choose saved payee (optional)</label>
						<select
							value={transferForm.selectedPayee}
							onChange={e => applyPayeeSelection(e.target.value)}
							style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--white)' }}
						>
							<option value="">-- Select payee --</option>
							{payees.map(p => (
								<option key={p.id} value={p.id}>
									{p.nickname || 'Payee'} • {p.payeeAccountNumber}
								</option>
							))}
						</select>
					</div>
					<div className="field">
						<label>Recipient Account Number</label>
						<input
							value={transferForm.toAccountNumber}
							onChange={e => setTransferForm({ ...transferForm, toAccountNumber: e.target.value })}
							placeholder="Enter 12-digit account number"
						/>
					</div>
					<div className="field">
						<label>Amount (BDT)</label>
						<input
							value={transferForm.amount}
							onChange={e => setTransferForm({ ...transferForm, amount: e.target.value })}
							placeholder="1000.00"
						/>
					</div>
					<div className="field">
						<label>Note (optional)</label>
						<input
							value={transferForm.note}
							onChange={e => setTransferForm({ ...transferForm, note: e.target.value })}
							placeholder="Rent, gift, invoice..."
						/>
					</div>
					<button disabled={transferStatus.loading} onClick={handleSendMoney}>
						{transferStatus.loading ? 'Sending…' : 'Send Money'}
					</button>
					<div className="error">{transferStatus.error}</div>
					<div className="success">{transferStatus.success}</div>
				</div>

				<div className="card">
					<h3 className="title" style={{ marginBottom: '12px' }}>Save Payee</h3>
					<div className="field">
						<label>Payee Account Number</label>
						<input
							value={payeeForm.accountNumber}
							onChange={e => setPayeeForm({ ...payeeForm, accountNumber: e.target.value })}
							placeholder="Enter payee account number"
						/>
					</div>
					<div className="field">
						<label>Nickname (optional)</label>
						<input
							value={payeeForm.nickname}
							onChange={e => setPayeeForm({ ...payeeForm, nickname: e.target.value })}
							placeholder="e.g., Mom, Landlord"
						/>
					</div>
					<button disabled={payeeStatus.loading} onClick={handleSavePayee}>
						{payeeStatus.loading ? 'Saving…' : 'Save Payee'}
					</button>
					<div className="error">{payeeStatus.error}</div>
					<div className="success">{payeeStatus.success}</div>

					<div style={{ marginTop: '16px' }}>
						<h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Saved Payees</h4>
						{payees.length === 0 ? (
							<div style={{ color: 'var(--muted)', fontSize: '13px' }}>No payees saved yet.</div>
						) : (
							<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
								{payees.map(p => (
									<div key={p.id} style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--card)' }}>
										<div style={{ fontWeight: '600', color: 'var(--white)' }}>{p.nickname || 'Payee'}</div>
										<div style={{ fontFamily: 'monospace', color: 'var(--muted)', fontSize: '13px' }}>{p.payeeAccountNumber}</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

