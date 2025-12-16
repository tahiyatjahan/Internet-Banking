import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import TopNav from './components/TopNav.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Profile from './pages/Profile.jsx'
import AddMoney from './pages/AddMoney.jsx'
import Microloan from './pages/Microloan.jsx'
import MoneyRequest from './pages/MoneyRequest.jsx'
import SendMoney from './pages/SendMoney.jsx'

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
		<div className="app-layout">
			<TopNav />
			<div className="container content-container">
				<Routes>
					<Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
					<Route path="/" element={<ProtectedRoute><AddMoney /></ProtectedRoute>} />
					<Route path="/add-money" element={<ProtectedRoute><AddMoney /></ProtectedRoute>} />
					<Route path="/loans" element={<ProtectedRoute><Microloan /></ProtectedRoute>} />
					<Route path="/requests" element={<ProtectedRoute><MoneyRequest /></ProtectedRoute>} />
					<Route path="/send-money" element={<ProtectedRoute><SendMoney /></ProtectedRoute>} />
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


