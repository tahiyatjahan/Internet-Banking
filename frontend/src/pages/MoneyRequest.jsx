import { useState, useEffect } from 'react'
import { postJson } from '../api'

export default function MoneyRequest() {
	const [userId, setUserId] = useState(1)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [activeTab, setActiveTab] = useState('create') // 'create', 'sent', 'received'
	const [form, setForm] = useState({ toUserId: '', amount: '', message: '' })
	const [requests, setRequests] = useState({ sent: [], received: [] })

	useEffect(() => {
		loadRequests()
	}, [userId])

	async function loadRequests() {
		try {
			const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:5000'}/api/requests/${userId}`)
			const data = await res.json()
			if (data.success) {
				setRequests({ sent: data.sent || [], received: data.received || [] })
			}
		} catch (e) {
			console.error('Failed to load requests:', e)
		}
	}

	async function createRequest() {
		setLoading(true); setError(''); setSuccess('')
		try {
			const res = await postJson('/api/requests/create', {
				fromUserId: userId,
				toUserId: form.toUserId,
				amount: form.amount,
				message: form.message
			})
			setSuccess(`Money request created! Request ID: ${res.requestId}`)
			setForm({ toUserId: '', amount: '', message: '' })
			loadRequests()
		} catch (e) {
			setError(e.message)
		} finally {
			setLoading(false)
		}
	}

	async function acceptRequest(requestId) {
		setLoading(true); setError(''); setSuccess('')
		try {
			const res = await postJson('/api/requests/accept', {
				requestId,
				userId
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
		setLoading(true); setError(''); setSuccess('')
		try {
			const res = await postJson('/api/requests/reject', {
				requestId,
				userId
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
					<div className="field" style={{ maxWidth: 240 }}>
						<label>Your User ID</label>
						<input value={userId} onChange={e => setUserId(Number(e.target.value || 0))} placeholder="1" />
					</div>
					<div className="field">
						<label>Request From User ID</label>
						<input value={form.toUserId} onChange={e => setForm({ ...form, toUserId: e.target.value })} placeholder="2" />
					</div>
					<div className="field">
						<label>Amount (BDT)</label>
						<input value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="500.00" />
					</div>
					<div className="field">
						<label>Message (Optional)</label>
						<textarea 
							value={form.message} 
							onChange={e => setForm({ ...form, message: e.target.value })} 
							placeholder="Please send money for..."
							style={{
								width: '100%',
								padding: '10px 12px',
								borderRadius: '8px',
								border: '1px solid #334155',
								background: '#0b1220',
								color: 'var(--white)',
								outline: 'none',
								minHeight: '80px',
								fontFamily: 'inherit',
								resize: 'vertical'
							}}
						/>
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
											<strong>Request #{req.id}</strong> - {Number(req.amount).toFixed(2)} BDT
											<br />
											<small style={{ color: 'var(--muted)' }}>
												To: User #{req.toUserId} | {req.message || 'No message'}
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
											<strong>Request #{req.id}</strong> - {Number(req.amount).toFixed(2)} BDT
											<br />
											<small style={{ color: 'var(--muted)' }}>
												From: User #{req.fromUserId} | {req.message || 'No message'}
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

