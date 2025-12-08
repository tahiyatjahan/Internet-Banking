import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Sidebar from './components/Sidebar.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Profile from './pages/Profile.jsx'
import CardTopup from './pages/CardTopup.jsx'
import BankTopup from './pages/BankTopup.jsx'
import PrepaidTopup from './pages/PrepaidTopup.jsx'
import Microloan from './pages/Microloan.jsx'
import MoneyRequest from './pages/MoneyRequest.jsx'

function ProtectedRoute({ children }) {
	const { user, loading } = useAuth()
	if (loading) return <div className="page">Loading...</div>
	if (!user) return <Navigate to="/login" replace />
	return children
}

function AppRoutes() {
	const { user } = useAuth()
	
	if (!user) {
		return (
			<Routes>
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />
				<Route path="*" element={<Navigate to="/login" replace />} />
			</Routes>
		)
	}
	
	return (
		<div className="container app-grid">
			<Sidebar />
			<div className="content">
				<Routes>
					<Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
					<Route path="/" element={<ProtectedRoute><CardTopup /></ProtectedRoute>} />
					<Route path="/bank" element={<ProtectedRoute><BankTopup /></ProtectedRoute>} />
					<Route path="/prepaid" element={<ProtectedRoute><PrepaidTopup /></ProtectedRoute>} />
					<Route path="/loans" element={<ProtectedRoute><Microloan /></ProtectedRoute>} />
					<Route path="/requests" element={<ProtectedRoute><MoneyRequest /></ProtectedRoute>} />
					<Route path="/login" element={<Navigate to="/profile" replace />} />
					<Route path="/register" element={<Navigate to="/profile" replace />} />
				</Routes>
			</div>
		</div>
	)
}

export default function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<AppRoutes />
			</AuthProvider>
		</BrowserRouter>
	)
}


