import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import NotificationBell from './NotificationBell.jsx'

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
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
					<Link to="/profile" style={{ textDecoration: 'none', color: 'inherit', display: 'block', flex: 1 }}>
						<div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '6px', fontWeight: '500' }}>Account</div>
						<div style={{ fontSize: '17px', fontWeight: '700', color: 'var(--white)', marginBottom: '4px', letterSpacing: '-0.3px' }}>{user?.fullName || 'User'}</div>
						<div style={{ fontSize: '12px', color: 'var(--muted)' }}>{user?.email}</div>
					</Link>
					<NotificationBell />
				</div>
			</div>
			<h2 className="sidebar-title">Menu</h2>
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
					label="Add Money"
					active={pathname === '/' || pathname === '/add-money'}
					icon={
						<svg width="36" height="36" viewBox="0 0 24 24" fill="none">
							<rect x="3" y="4" width="18" height="14" rx="3" stroke="#2563eb" strokeWidth="2"/>
							<path d="M7 11h10" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
							<path d="M12 8v6" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
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
				<Tile
					to="/investments"
					label="Investments"
					active={pathname === '/investments'}
					icon={
						<svg width="36" height="36" viewBox="0 0 24 24" fill="none">
							<path d="M4 20v-6l4-4 4 4 6-6" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							<path d="M14 4h6v6" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
						</svg>
					}
				/>
				<Tile
					to="/security"
					label="Security"
					active={pathname === '/security'}
					icon={
						<svg width="36" height="36" viewBox="0 0 24 24" fill="none">
							<path d="M12 2 5 5v6c0 4 2.8 7.4 7 9 4.2-1.6 7-5 7-9V5z" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							<path d="M10 11.5 11.5 13 15 9.5" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
						</svg>
					}
				/>
			</div>
		</aside>
	)
}




