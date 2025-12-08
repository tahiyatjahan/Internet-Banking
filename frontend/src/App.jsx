import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Nav from './components/Nav.jsx'
import CardTopup from './pages/CardTopup.jsx'
import BankTopup from './pages/BankTopup.jsx'
import PrepaidTopup from './pages/PrepaidTopup.jsx'
import Microloan from './pages/Microloan.jsx'
import MoneyRequest from './pages/MoneyRequest.jsx'

export default function App() {
	return (
		<BrowserRouter>
			<div className="container">
				<Nav />
				<Routes>
					<Route path="/" element={<CardTopup />} />
					<Route path="/bank" element={<BankTopup />} />
					<Route path="/prepaid" element={<PrepaidTopup />} />
					<Route path="/loans" element={<Microloan />} />
					<Route path="/requests" element={<MoneyRequest />} />
				</Routes>
			</div>
		</BrowserRouter>
	)
}


