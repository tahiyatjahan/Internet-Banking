import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Nav from './components/Nav.jsx'
import CardTopup from './pages/CardTopup.jsx'
import BankTopup from './pages/BankTopup.jsx'

export default function App() {
	return (
		<BrowserRouter>
			<div className="container">
				<Nav />
				<Routes>
					<Route path="/" element={<CardTopup />} />
					<Route path="/bank" element={<BankTopup />} />
				</Routes>
			</div>
		</BrowserRouter>
	)
}


