import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:9135'

export default function Security() {
	const { user } = useAuth()
	const [loading, setLoading] = useState(false)
	const [otpLoading, setOtpLoading] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [otpSent, setOtpSent] = useState(false)
	const [form, setForm] = useState({
		dailyLimit: '',
		perTransactionLimit: '',
		otp: ''
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
					perTransactionLimit: data.limits.perTransactionLimit ?? '',
					otp: ''
				})
			}
		} catch (e) {
			console.error('Failed to load limits:', e)
		}
	}

	async function handleRequestOTP() {
		setOtpLoading(true)
		setError('')
		setSuccess('')
		try {
			const token = localStorage.getItem('token')
			const res = await fetch(`${API_BASE}/api/limits/request-otp`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			})
			const data = await res.json()
			if (!data.success) {
				throw new Error(data.error || 'Failed to send OTP')
			}
			setOtpSent(true)
			
			// If OTP is included in response (dev mode), show it
			if (data.otp) {
				setSuccess(`OTP: ${data.otp} (Development mode - check your email in production)`)
				// Also auto-fill the OTP field for convenience
				setForm({ ...form, otp: data.otp })
			} else {
				setSuccess(data.message || 'OTP has been sent to your email address. Please check your inbox.')
			}
		} catch (e) {
			setError(e.message)
		} finally {
			setOtpLoading(false)
		}
	}

	async function handleSave() {
		setLoading(true)
		setError('')
		setSuccess('')
		
		if (!form.otp) {
			setError('Please request and enter the OTP to change transaction limits.')
			setLoading(false)
			return
		}

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
					perTransactionLimit: form.perTransactionLimit === '' ? null : form.perTransactionLimit,
					otp: form.otp
				})
			})
			const data = await res.json()
			if (!data.success) {
				throw new Error(data.error || 'Failed to update limits')
			}
			setSuccess('Transaction limits updated successfully.')
			setOtpSent(false)
			setForm({ ...form, otp: '' })
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
					<br />
					<strong style={{ color: 'var(--accent)' }}>Security:</strong> An OTP will be sent to your email to verify limit changes.
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

				<div style={{ marginBottom: '16px', padding: '12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
						<label style={{ margin: 0, fontWeight: '600' }}>OTP Verification</label>
						{!otpSent && (
							<button
								type="button"
								disabled={otpLoading}
								onClick={handleRequestOTP}
								style={{
									padding: '6px 12px',
									fontSize: '12px',
									background: 'var(--accent)',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									cursor: otpLoading ? 'not-allowed' : 'pointer',
									opacity: otpLoading ? 0.6 : 1
								}}
							>
								{otpLoading ? 'Sending…' : 'Send OTP'}
							</button>
						)}
						{otpSent && (
							<span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '600' }}>
								✓ OTP Sent
							</span>
						)}
					</div>
					<input
						value={form.otp}
						onChange={e => setForm({ ...form, otp: e.target.value })}
						placeholder="Enter 6-digit OTP from your email"
						maxLength="6"
						style={{
							width: '100%',
							padding: '10px 12px',
							borderRadius: '8px',
							border: '1px solid var(--border)',
							background: 'var(--card)',
							color: 'var(--white)',
							fontSize: '16px',
							letterSpacing: '4px',
							textAlign: 'center'
						}}
					/>
					<small style={{ color: 'var(--muted)', fontSize: '11px', display: 'block', marginTop: '6px' }}>
						Check your email ({user?.email}) for the OTP. It expires in 10 minutes.
					</small>
				</div>

				<button disabled={loading || !otpSent} onClick={handleSave}>
					{loading ? 'Saving…' : 'Save Limits'}
				</button>
				<div className="error">{error}</div>
				<div className="success">{success}</div>
			</div>
		</div>
	)
}


