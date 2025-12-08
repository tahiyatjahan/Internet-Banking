import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function Tile({ to, icon, label, active }) {
	return (
		<Link to={to} className={`tile ${active ? 'active' : ''}`}>
			<div className="tile-icon" aria-hidden>{icon}</div>
			<div className="tile-label">{label}</div>
		</Link>
	)
}

export default function Sidebar() {
	const { pathname } = useLocation()
	const { user } = useAuth()
	return (
		<aside className="sidebar">
			<div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
				<Link to="/profile" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
					<div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '6px', fontWeight: '500' }}>Account</div>
					<div style={{ fontSize: '17px', fontWeight: '700', color: 'var(--white)', marginBottom: '4px', letterSpacing: '-0.3px' }}>{user?.fullName || 'User'}</div>
					<div style={{ fontSize: '12px', color: 'var(--muted)' }}>{user?.email}</div>
				</Link>
			</div>
			<h2 className="sidebar-title">Add Money</h2>
			<div className="tiles">
				<Tile
					to="/profile"
					label="Profile"
					active={pathname === '/profile'}
					icon={
						<svg width="36" height="36" viewBox="0 0 24 24" fill="none">
							<circle cx="12" cy="8" r="4" stroke="#2563eb" strokeWidth="2"/>
							<path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="#2563eb" strokeWidth="2"/>
						</svg>
					}
				/>
				<Tile
					to="/"
					label="Card"
					active={pathname === '/'}
					icon={
						<svg width="36" height="36" viewBox="0 0 24 24" fill="none">
							<rect x="2" y="5" width="20" height="14" rx="3" stroke="#2563eb" strokeWidth="2"/>
							<rect x="3.5" y="9" width="17" height="2" fill="#2563eb"/>
							<rect x="5" y="14" width="5" height="2" rx="1" fill="#93c5fd"/>
						</svg>
					}
				/>
				<Tile
					to="/bank"
					label="Bank"
					active={pathname === '/bank'}
					icon={
						<svg width="36" height="36" viewBox="0 0 24 24" fill="none">
							<path d="M3 9L12 4l9 5" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							<path d="M4 10h16v8H4z" stroke="#2563eb" strokeWidth="2"/>
							<path d="M7 14h2M11 14h2M15 14h2" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round"/>
						</svg>
					}
				/>
				<Tile
					to="/prepaid"
					label="Prepaid/Gift"
					active={pathname === '/prepaid'}
					icon={
						<svg width="36" height="36" viewBox="0 0 24 24" fill="none">
							<rect x="3" y="8" width="18" height="12" rx="2" stroke="#2563eb" strokeWidth="2"/>
							<path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" stroke="#2563eb" strokeWidth="2"/>
							<circle cx="12" cy="14" r="2" fill="#93c5fd"/>
						</svg>
					}
				/>
				<Tile
					to="/loans"
					label="Microloans"
					active={pathname === '/loans'}
					icon={
						<svg width="36" height="36" viewBox="0 0 24 24" fill="none">
							<path d="M12 2v20M2 12h20" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
							<circle cx="12" cy="12" r="3" fill="#93c5fd"/>
						</svg>
					}
				/>
				<Tile
					to="/requests"
					label="Money Requests"
					active={pathname === '/requests'}
					icon={
						<svg width="36" height="36" viewBox="0 0 24 24" fill="none">
							<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#2563eb" strokeWidth="2"/>
							<path d="M8 10h8M8 14h6" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round"/>
						</svg>
					}
				/>
			</div>
		</aside>
	)
}




