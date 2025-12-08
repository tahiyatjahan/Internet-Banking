import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:9135'

export default function Login() {
	const [form, setForm] = useState({ email: '', password: '' })
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const { login } = useAuth()
	const navigate = useNavigate()

	async function handleSubmit(e) {
		e.preventDefault()
		setLoading(true)
		setError('')
		
		try {
			const res = await fetch(`${API_BASE}/api/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form)
			})
			const data = await res.json()
			
			if (data.success) {
				login(data.token, data.user)
				navigate('/profile')
			} else {
				setError(data.error || 'Login failed')
			}
		} catch (e) {
			setError('Network error. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="page" style={{ maxWidth: '400px', margin: '0 auto' }}>
			<h2 className="page-title">Login</h2>
			<p className="subtitle">Sign in to your Internet Banking account</p>
			
			<form className="card" onSubmit={handleSubmit}>
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
					/>
				</div>
				<button type="submit" disabled={loading}>
					{loading ? 'Logging in...' : 'Login'}
				</button>
				<div className="error">{error}</div>
				<div style={{ marginTop: '16px', textAlign: 'center', color: 'var(--muted)' }}>
					Don't have an account? <Link to="/register" style={{ color: 'var(--accent)' }}>Register here</Link>
				</div>
				<div style={{ marginTop: '8px', textAlign: 'center', fontSize: '12px', color: 'var(--muted)' }}>
					Demo: demo@example.com / demo123
				</div>
			</form>
		</div>
	)
}


