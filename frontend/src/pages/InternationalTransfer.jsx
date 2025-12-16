import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { postJson } from '../api'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:9135'

export default function InternationalTransfer() {
	const { user } = useAuth()
	const [currencies, setCurrencies] = useState([])
	const [loading, setLoading] = useState(false)
	const [calculating, setCalculating] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	
	const [form, setForm] = useState({
		toAccountNumber: '',
		amount: '',
		fromCurrency: 'BDT',
		toCurrency: 'USD',
		recipientName: '',
		recipientEmail: ''
	})
	
	const [conversion, setConversion] = useState(null)

	useEffect(() => {
		loadCurrencies()
	}, [])

	useEffect(() => {
		if (form.amount && parseFloat(form.amount) > 0) {
			calculateConversion()
		} else {
			setConversion(null)
		}
	}, [form.amount, form.fromCurrency, form.toCurrency])

	async function loadCurrencies() {
		try {
			const res = await fetch(`${API_BASE}/api/international/currencies`)
			const data = await res.json()
			if (data.success) {
				setCurrencies(data.currencies || [])
			}
		} catch (e) {
			console.error('Failed to load currencies:', e)
		}
	}

	async function calculateConversion() {
		if (!form.amount || parseFloat(form.amount) <= 0) {
			setConversion(null)
			return
		}

		setCalculating(true)
		try {
			const res = await fetch(`${API_BASE}/api/international/calculate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					fromCurrency: form.fromCurrency,
					toCurrency: form.toCurrency,
					amount: form.amount
				})
			})
			const data = await res.json()
			if (data.success) {
				setConversion(data)
			}
		} catch (e) {
			console.error('Failed to calculate conversion:', e)
		} finally {
			setCalculating(false)
		}
	}

	async function handleSubmit() {
		if (!user) {
			setError('Please login first')
			return
		}

		if (!form.toAccountNumber || !form.amount) {
			setError('Please fill in all required fields')
			return
		}

		setLoading(true)
		setError('')
		setSuccess('')

		try {
			const res = await postJson('/api/international/send', {
				fromUserId: user.id,
				toAccountNumber: form.toAccountNumber,
				amount: form.amount,
				fromCurrency: form.fromCurrency,
				toCurrency: form.toCurrency,
				recipientName: form.recipientName,
				recipientEmail: form.recipientEmail
			})

			setSuccess(`International transfer successful! Sent ${form.amount} ${form.fromCurrency}, recipient will receive ${res.receivedAmount} ${res.receivedCurrency}`)
			setForm({
				toAccountNumber: '',
				amount: '',
				fromCurrency: 'BDT',
				toCurrency: 'USD',
				recipientName: '',
				recipientEmail: ''
			})
			setConversion(null)
		} catch (e) {
			setError(e.message)
		} finally {
			setLoading(false)
		}
	}

	function getCurrencySymbol(code) {
		const symbols = {
			BDT: '৳',
			USD: '$',
			EUR: '€',
			GBP: '£',
			INR: '₹',
			AED: 'د.إ',
			SAR: '﷼',
			CAD: 'C$',
			AUD: 'A$',
			JPY: '¥',
			CNY: '¥',
		}
		return symbols[code] || code
	}

	return (
		<div className="page">
			<div style={{ marginBottom: '24px' }}>
				<h2 className="page-title" style={{ marginBottom: '4px', fontSize: '28px' }}>International Transfer</h2>
				<p className="subtitle" style={{ margin: 0, fontSize: '14px' }}>Send money worldwide with automatic currency conversion</p>
			</div>

			<div className="card">
				<h3 className="title">Transfer Details</h3>
				
				<div className="field">
					<label>Recipient Account Number</label>
					<input
						value={form.toAccountNumber}
						onChange={e => setForm({ ...form, toAccountNumber: e.target.value })}
						placeholder="Enter recipient account number"
					/>
				</div>

				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
					<div className="field">
						<label>From Currency</label>
						<select
							value={form.fromCurrency}
							onChange={e => setForm({ ...form, fromCurrency: e.target.value })}
							style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--white)' }}
						>
							{currencies.map(curr => (
								<option key={curr.code} value={curr.code}>
									{curr.code} - {curr.name}
								</option>
							))}
						</select>
					</div>

					<div className="field">
						<label>To Currency</label>
						<select
							value={form.toCurrency}
							onChange={e => setForm({ ...form, toCurrency: e.target.value })}
							style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--white)' }}
						>
							{currencies.filter(c => c.code !== form.fromCurrency).map(curr => (
								<option key={curr.code} value={curr.code}>
									{curr.code} - {curr.name}
								</option>
							))}
						</select>
					</div>
				</div>

				<div className="field">
					<label>Amount to Send ({form.fromCurrency})</label>
					<input
						type="number"
						step="0.01"
						value={form.amount}
						onChange={e => setForm({ ...form, amount: e.target.value })}
						placeholder="0.00"
					/>
				</div>

				{/* Conversion Preview */}
				{conversion && (
					<div style={{
						background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
						border: '1px solid var(--accent)',
						borderRadius: '12px',
						padding: '16px',
						marginBottom: '20px'
					}}>
						<div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px', fontWeight: '600' }}>
							Transfer Summary
						</div>
						<div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
							<div style={{ display: 'flex', justifyContent: 'space-between' }}>
								<span style={{ color: 'var(--muted)' }}>You send:</span>
								<span style={{ fontWeight: '600', color: 'var(--white)' }}>
									{getCurrencySymbol(form.fromCurrency)}{conversion.originalAmount} {form.fromCurrency}
								</span>
							</div>
							<div style={{ display: 'flex', justifyContent: 'space-between' }}>
								<span style={{ color: 'var(--muted)' }}>Recipient receives:</span>
								<span style={{ fontWeight: '600', color: 'var(--white)' }}>
									{getCurrencySymbol(form.toCurrency)}{conversion.convertedAmount} {form.toCurrency}
								</span>
							</div>
							<div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
								<span style={{ color: 'var(--muted)' }}>Exchange rate:</span>
								<span style={{ fontWeight: '500', color: 'var(--white)' }}>
									1 {form.fromCurrency} = {conversion.exchangeRate} {form.toCurrency}
								</span>
							</div>
							<div style={{ display: 'flex', justifyContent: 'space-between' }}>
								<span style={{ color: 'var(--muted)' }}>Transfer fee:</span>
								<span style={{ fontWeight: '500', color: 'var(--white)' }}>
									৳{conversion.fee} BDT
								</span>
							</div>
							<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)', fontSize: '15px' }}>
								<span style={{ fontWeight: '600', color: 'var(--white)' }}>Total deduction:</span>
								<span style={{ fontWeight: '700', color: 'var(--accent)' }}>
									৳{conversion.totalDeduction} BDT
								</span>
							</div>
						</div>
					</div>
				)}

				<div className="field">
					<label>Recipient Name (Optional)</label>
					<input
						value={form.recipientName}
						onChange={e => setForm({ ...form, recipientName: e.target.value })}
						placeholder="Enter recipient name"
					/>
				</div>

				<div className="field">
					<label>Recipient Email (Optional)</label>
					<input
						type="email"
						value={form.recipientEmail}
						onChange={e => setForm({ ...form, recipientEmail: e.target.value })}
						placeholder="Enter recipient email"
					/>
				</div>

				<button disabled={loading || calculating || !conversion} onClick={handleSubmit}>
					{loading ? 'Processing...' : calculating ? 'Calculating...' : 'Send Money'}
				</button>
				
				<div className="error">{error}</div>
				<div className="success">{success}</div>
			</div>

			{/* Info Card */}
			<div className="card" style={{ marginTop: '20px', background: '#f8fafc' }}>
				<h3 className="title" style={{ fontSize: '16px', marginBottom: '12px' }}>Important Information</h3>
				<ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--muted)', lineHeight: '1.8' }}>
					<li>Transfer fee: 2% of the amount (minimum ৳50 BDT)</li>
					<li>Exchange rates are updated regularly</li>
					<li>Transfers are processed instantly</li>
					<li>Both sender and recipient will receive notifications</li>
				</ul>
			</div>
		</div>
	)
}

