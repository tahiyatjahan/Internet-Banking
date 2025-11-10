const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'

export async function postJson(path, body) {
	const res = await fetch(`${API_BASE}${path}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	})
	const data = await res.json().catch(() => ({}))
	if (!res.ok || data.success === false) {
		throw new Error(data.error || `Request failed: ${res.status}`)
	}
	return data
}


