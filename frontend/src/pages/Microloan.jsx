import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { postJson } from '../api'

export default function Microloan() {
	const { user } = useAuth()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [balance, setBalance] = useState(null)
	const [loans, setLoans] = useState([])
	const [activeTab, setActiveTab] = useState('request') // 'request' or 'repay'
	const [form, setForm] = useState({ amount: '', interestRate: '5.0', termDays: '30' })
	const [repayLoanId, setRepayLoanId] = useState('')

	useEffect(() => {
		if (user) loadLoans()
	}, [user])

	async function loadLoans() {
		if (!user) return
		try {
			const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:9135'}/api/loans/${user.id}`)
			const data = await res.json()
			if (data.success) {
				setLoans(data.loans)
			}
		} catch (e) {
			console.error('Failed to load loans:', e)
		}
	}

	async function requestLoan() {
		if (!user) {
			setError('Please login first')
			return
		}
		setLoading(true); setError(''); setSuccess('')
		try {
			const res = await postJson('/api/loans/request', {
				userId: user.id,
				amount: form.amount,
				interestRate: form.interestRate,
				termDays: form.termDays
			})
			setSuccess(`Loan approved! Loan ID: ${res.loanId}. Amount: ${res.amount} BDT. Total to repay: ${res.totalAmount} BDT. Due: ${res.dueDate}`)
			setBalance(res.balance)
			setForm({ amount: '', interestRate: '5.0', termDays: '30' })
			loadLoans()
		} catch (e) {
			setError(e.message)
		} finally {
			setLoading(false)
		}
	}

	async function repayLoan() {
		if (!user) {
			setError('Please login first')
			return
		}
		setLoading(true); setError(''); setSuccess('')
		try {
			const res = await postJson('/api/loans/repay', {
				userId: user.id,
				loanId: repayLoanId
			})
			setSuccess(`Loan repaid successfully! Repaid amount: ${res.repaidAmount} BDT`)
			setBalance(res.balance)
			setRepayLoanId('')
			loadLoans()
		} catch (e) {
			setError(e.message)
		} finally {
			setLoading(false)
		}
	}

	const activeLoans = loans.filter(l => l.status === 'ACTIVE')

	return (
		<div className="page">
			<h2 className="page-title">Microloans</h2>
			<p className="subtitle">Request or repay microloans. All amounts are in BDT (৳).</p>
			<div className="balance">Latest balance result: {balance ?? '—'} BDT</div>
			
			<div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
				<button 
					onClick={() => setActiveTab('request')}
					style={{ 
						width: 'auto', 
						background: activeTab === 'request' ? 'var(--accent)' : '#1f2937',
						marginTop: 0
					}}
				>
					Request Loan
				</button>
				<button 
					onClick={() => setActiveTab('repay')}
					style={{ 
						width: 'auto', 
						background: activeTab === 'repay' ? 'var(--accent)' : '#1f2937',
						marginTop: 0
					}}
				>
					Repay Loan
				</button>
			</div>

			{activeTab === 'request' && (
				<div className="form card">
					<div className="field">
						<label>Loan Amount (BDT)</label>
						<input value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="5000.00" />
						<small style={{ color: 'var(--muted)', fontSize: '11px' }}>Min: 100 BDT, Max: 50,000 BDT</small>
					</div>
					<div className="row">
						<div className="field">
							<label>Interest Rate (%)</label>
							<input value={form.interestRate} onChange={e => setForm({ ...form, interestRate: e.target.value })} placeholder="5.0" />
						</div>
						<div className="field">
							<label>Term (Days)</label>
							<input value={form.termDays} onChange={e => setForm({ ...form, termDays: e.target.value })} placeholder="30" />
						</div>
					</div>
					<button disabled={loading} onClick={requestLoan}>{loading ? 'Processing…' : 'Request Loan'}</button>
					<div className="error">{error}</div>
					<div className="success">{success}</div>
				</div>
			)}

			{activeTab === 'repay' && (
				<div className="form card">
					{activeLoans.length > 0 ? (
						<>
							<div className="field">
								<label>Select Loan to Repay</label>
								<select 
									value={repayLoanId} 
									onChange={e => setRepayLoanId(e.target.value)}
									style={{
										width: '100%',
										padding: '10px 12px',
										borderRadius: '8px',
										border: '1px solid #334155',
										background: '#0b1220',
										color: 'var(--white)',
										outline: 'none'
									}}
								>
									<option value="">Select a loan...</option>
									{activeLoans.map(loan => (
										<option key={loan.id} value={loan.id}>
											Loan #{loan.id}: {Number(loan.amount).toFixed(2)} BDT (Total: {Number(loan.totalAmount).toFixed(2)} BDT) - Due: {new Date(loan.dueDate).toLocaleDateString()}
										</option>
									))}
								</select>
							</div>
							<button disabled={loading || !repayLoanId} onClick={repayLoan}>{loading ? 'Processing…' : 'Repay Loan'}</button>
						</>
					) : (
						<p style={{ color: 'var(--muted)' }}>No active loans to repay.</p>
					)}
					<div className="error">{error}</div>
					<div className="success">{success}</div>
				</div>
			)}

			{loans.length > 0 && (
				<div className="card" style={{ marginTop: '16px' }}>
					<h3 className="title">Loan History</h3>
					<div style={{ fontSize: '14px' }}>
						{loans.map(loan => (
							<div key={loan.id} style={{ padding: '8px 0', borderBottom: '1px solid #1f2937' }}>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<div>
										<strong>Loan #{loan.id}</strong> - {Number(loan.amount).toFixed(2)} BDT
										<br />
										<small style={{ color: 'var(--muted)' }}>
											Status: {loan.status} | Interest: {Number(loan.interestRate).toFixed(2)}% | 
											Total: {Number(loan.totalAmount).toFixed(2)} BDT | 
											Due: {new Date(loan.dueDate).toLocaleDateString()}
										</small>
									</div>
									<span style={{ 
										padding: '4px 8px', 
										borderRadius: '4px',
										background: loan.status === 'ACTIVE' ? '#f59e0b' : loan.status === 'REPAID' ? 'var(--accent)' : '#6b7280',
										fontSize: '11px'
									}}>
										{loan.status}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

