import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const token = localStorage.getItem('token')
		if (token) {
			loadUser()
		} else {
			setLoading(false)
		}
	}, [])

	async function loadUser() {
		try {
			const token = localStorage.getItem('token')
			if (!token) return
			
			const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:9135'}/api/auth/me`, {
				headers: { Authorization: `Bearer ${token}` }
			})
			const data = await res.json()
			if (data.success) {
				setUser(data.user)
			} else {
				localStorage.removeItem('token')
			}
		} catch (e) {
			console.error('Failed to load user:', e)
			localStorage.removeItem('token')
		} finally {
			setLoading(false)
		}
	}

	function login(token, userData) {
		localStorage.setItem('token', token)
		setUser(userData)
	}

	function logout() {
		localStorage.removeItem('token')
		setUser(null)
	}

	return (
		<AuthContext.Provider value={{ user, loading, login, logout, loadUser }}>
			{children}
		</AuthContext.Provider>
	)
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error('useAuth must be used within AuthProvider')
	}
	return context
}


