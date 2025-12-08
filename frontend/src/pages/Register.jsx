import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:9135'

export default function Register() {
	const [form, setForm] = useState({ email: '', fullName: '', password: '', confirmPassword: '' })
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const { login } = useAuth()
	const navigate = useNavigate()

	async function handleSubmit(e) {
		e.preventDefault()
		setLoading(true)
		setError('')
		
		if (form.password !== form.confirmPassword) {
			setError('Passwords do not match')
			setLoading(false)
			return
		}
		
		if (form.password.length < 6) {
			setError('Password must be at least 6 characters')
			setLoading(false)
			return
		}
		
		try {
			const res = await fetch(`${API_BASE}/api/auth/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: form.email,
					fullName: form.fullName,
					password: form.password
				})
			})
			const data = await res.json()
			
			if (data.success) {
				login(data.token, data.user)
				navigate('/profile')
			} else {
				setError(data.error || 'Registration failed')
			}
		} catch (e) {
			setError('Network error. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="page" style={{ maxWidth: '400px', margin: '0 auto' }}>
			<h2 className="page-title">Register</h2>
			<p className="subtitle">Create a new Internet Banking account</p>
			
			<form className="card" onSubmit={handleSubmit}>
				<div className="field">
					<label>Full Name</label>
					<input
						type="text"
						value={form.fullName}
						onChange={e => setForm({ ...form, fullName: e.target.value })}
						placeholder="John Doe"
						required
					/>
				</div>
				<div className="field">
					<label>Email</label>
					<input
						type="email"
						value={form.email}
						onChange={e => setForm({ ...form, email: e.target.value })}
						placeholder="your@email.com"
						required
					/>
				</div>
				<div className="field">
					<label>Password</label>
					<input
						type="password"
						value={form.password}
						onChange={e => setForm({ ...form, password: e.target.value })}
						placeholder="••••••"
						required
						minLength={6}
					/>
					<small style={{ color: 'var(--muted)', fontSize: '11px' }}>Minimum 6 characters</small>
				</div>
				<div className="field">
					<label>Confirm Password</label>
					<input
						type="password"
						value={form.confirmPassword}
						onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
						placeholder="••••••"
						required
					/>
				</div>
				<button type="submit" disabled={loading}>
					{loading ? 'Creating account...' : 'Register'}
				</button>
				<div className="error">{error}</div>
				<div style={{ marginTop: '16px', textAlign: 'center', color: 'var(--muted)' }}>
					Already have an account? <Link to="/login" style={{ color: 'var(--accent)' }}>Login here</Link>
				</div>
			</form>
		</div>
	)
}


