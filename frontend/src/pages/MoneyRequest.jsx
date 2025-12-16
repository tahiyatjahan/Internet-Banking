import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { postJson } from '../api'

export default function MoneyRequest() {
	const { user } = useAuth()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [activeTab, setActiveTab] = useState('create') // 'create', 'sent', 'received'
	const [form, setForm] = useState({ toAccountNumber: '', amount: '' })
	const [requests, setRequests] = useState({ sent: [], received: [] })

	useEffect(() => {
		if (user) loadRequests()
	}, [user])

	async function loadRequests() {
		if (!user) return
		try {
			const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:9135'}/api/requests/${user.id}`)
			const data = await res.json()
			if (data.success) {
				setRequests({ sent: data.sent || [], received: data.received || [] })
			}
		} catch (e) {
			console.error('Failed to load requests:', e)
		}
	}

	async function createRequest() {
		if (!user) {
			setError('Please login first')
			return
		}
		setLoading(true); setError(''); setSuccess('')
		try {
			const res = await postJson('/api/requests/create', {
				fromUserId: user.id,
				toAccountNumber: form.toAccountNumber,
				amount: form.amount
			})
			setSuccess(`Money request created successfully!`)
			setForm({ toAccountNumber: '', amount: '' })
			loadRequests()
		} catch (e) {
			setError(e.message)
		} finally {
			setLoading(false)
		}
	}

	async function acceptRequest(requestId) {
		if (!user) {
			setError('Please login first')
			return
		}
		setLoading(true); setError(''); setSuccess('')
		try {
			const res = await postJson('/api/requests/accept', {
				requestId,
				userId: user.id
			})
			setSuccess(`Request accepted! Amount transferred: ${res.amount} BDT`)
			loadRequests()
		} catch (e) {
			setError(e.message)
		} finally {
			setLoading(false)
		}
	}

	async function rejectRequest(requestId) {
		if (!user) {
			setError('Please login first')
			return
		}
		setLoading(true); setError(''); setSuccess('')
		try {
			const res = await postJson('/api/requests/reject', {
				requestId,
				userId: user.id
			})
			setSuccess('Request rejected')
			loadRequests()
		} catch (e) {
			setError(e.message)
		} finally {
			setLoading(false)
		}
	}

	const pendingReceived = requests.received.filter(r => r.status === 'PENDING')

	return (
		<div className="page">
			<h2 className="page-title">Money Requests</h2>
			<p className="subtitle">Request money from other users or manage incoming requests. All amounts are in BDT (৳).</p>
			
			<div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
				<button 
					onClick={() => setActiveTab('create')}
					style={{ 
						width: 'auto', 
						background: activeTab === 'create' ? 'var(--accent)' : '#1f2937',
						marginTop: 0
					}}
				>
					Create Request
				</button>
				<button 
					onClick={() => setActiveTab('sent')}
					style={{ 
						width: 'auto', 
						background: activeTab === 'sent' ? 'var(--accent)' : '#1f2937',
						marginTop: 0
					}}
				>
					Sent ({requests.sent.length})
				</button>
				<button 
					onClick={() => setActiveTab('received')}
					style={{ 
						width: 'auto', 
						background: activeTab === 'received' ? 'var(--accent)' : '#1f2937',
						marginTop: 0
					}}
				>
					Received ({requests.received.length})
					{pendingReceived.length > 0 && <span style={{ marginLeft: '4px', background: '#f59e0b', padding: '2px 6px', borderRadius: '4px' }}>{pendingReceived.length}</span>}
				</button>
			</div>

			{activeTab === 'create' && (
				<div className="form card">
					<div className="field">
						<label>Request From Account Number</label>
						<input value={form.toAccountNumber} onChange={e => setForm({ ...form, toAccountNumber: e.target.value })} placeholder="123456789012" />
					</div>
					<div className="field">
						<label>Amount (BDT)</label>
						<input value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="500.00" />
					</div>
					<button disabled={loading} onClick={createRequest}>{loading ? 'Processing…' : 'Create Request'}</button>
					<div className="error">{error}</div>
					<div className="success">{success}</div>
				</div>
			)}

			{activeTab === 'sent' && (
				<div className="card">
					<h3 className="title">Sent Requests</h3>
					{requests.sent.length === 0 ? (
						<p style={{ color: 'var(--muted)' }}>No sent requests.</p>
					) : (
						<div style={{ fontSize: '14px' }}>
							{requests.sent.map(req => (
								<div key={req.id} style={{ padding: '12px 0', borderBottom: '1px solid #1f2937' }}>
									<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
										<div style={{ flex: 1 }}>
											<strong>{Number(req.amount).toFixed(2)} BDT</strong>
											<br />
											<small style={{ color: 'var(--muted)' }}>
												To: Account {req.toUser?.account?.accountNumber || 'N/A'} ({req.toUser?.fullName || 'Unknown'})
											</small>
											<br />
											<small style={{ color: 'var(--muted)' }}>
												{new Date(req.created_at).toLocaleString()}
											</small>
										</div>
										<span style={{ 
											padding: '4px 8px', 
											borderRadius: '4px',
											background: req.status === 'PENDING' ? '#f59e0b' : req.status === 'ACCEPTED' ? 'var(--accent)' : '#ef4444',
											fontSize: '11px',
											marginLeft: '12px'
										}}>
											{req.status}
										</span>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{activeTab === 'received' && (
				<div className="card">
					<h3 className="title">Received Requests</h3>
					{requests.received.length === 0 ? (
						<p style={{ color: 'var(--muted)' }}>No received requests.</p>
					) : (
						<div style={{ fontSize: '14px' }}>
							{requests.received.map(req => (
								<div key={req.id} style={{ padding: '12px 0', borderBottom: '1px solid #1f2937' }}>
									<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
										<div style={{ flex: 1 }}>
											<strong>{Number(req.amount).toFixed(2)} BDT</strong>
											<br />
											<small style={{ color: 'var(--muted)' }}>
												From: Account {req.fromUser?.account?.accountNumber || 'N/A'} ({req.fromUser?.fullName || 'Unknown'})
											</small>
											<br />
											<small style={{ color: 'var(--muted)' }}>
												{new Date(req.created_at).toLocaleString()}
											</small>
										</div>
										<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
											<span style={{ 
												padding: '4px 8px', 
												borderRadius: '4px',
												background: req.status === 'PENDING' ? '#f59e0b' : req.status === 'ACCEPTED' ? 'var(--accent)' : '#ef4444',
												fontSize: '11px'
											}}>
												{req.status}
											</span>
											{req.status === 'PENDING' && (
												<>
													<button 
														onClick={() => acceptRequest(req.id)}
														disabled={loading}
														style={{ 
															width: 'auto', 
															padding: '6px 12px',
															marginTop: 0,
															fontSize: '12px'
														}}
													>
														Accept
													</button>
													<button 
														onClick={() => rejectRequest(req.id)}
														disabled={loading}
														style={{ 
															width: 'auto', 
															padding: '6px 12px',
															marginTop: 0,
															fontSize: '12px',
															background: 'var(--danger)'
														}}
													>
														Reject
													</button>
												</>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					)}
					<div className="error">{error}</div>
					<div className="success">{success}</div>
				</div>
			)}
		</div>
	)
}

