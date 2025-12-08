const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:9135'

export async function postJson(path, body, includeAuth = true) {
	const headers = { 'Content-Type': 'application/json' }
	if (includeAuth) {
		const token = localStorage.getItem('token')
		if (token) {
			headers['Authorization'] = `Bearer ${token}`
		}
	}
	
	const res = await fetch(`${API_BASE}${path}`, {
		method: 'POST',
		headers,
		body: JSON.stringify(body)
	})
	const data = await res.json().catch(() => ({}))
	if (!res.ok || data.success === false) {
		throw new Error(data.error || `Request failed: ${res.status}`)
	}
	return data
}


