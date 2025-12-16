import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import NotificationBell from './NotificationBell.jsx'

function NavButton({ to, icon, label, active }) {
	return (
		<Link to={to} className={`nav-button ${active ? 'active' : ''}`}>
			<div className="nav-button-icon" aria-hidden>{icon}</div>
			<div className="nav-button-label">{label}</div>
		</Link>
	)
}

export default function TopNav() {
	const { pathname } = useLocation()
	const { user } = useAuth()
	
	return (
		<nav className="top-nav">
			<div className="top-nav-inner">
				<div className="top-nav-left">
					<Link to="/profile" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '12px' }}>
						<div>
							<div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '2px', fontWeight: '500' }}>Account</div>
							<div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--white)', letterSpacing: '-0.3px' }}>{user?.fullName || 'User'}</div>
						</div>
					</Link>
				</div>
				<div className="top-nav-right">
					<NavButton
						to="/profile"
						label="Profile"
						active={pathname === '/profile'}
						icon={
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
								<circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
								<path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2"/>
							</svg>
						}
					/>
					<NavButton
						to="/"
						label="Add Money"
						active={pathname === '/' || pathname === '/add-money'}
						icon={
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
								<rect x="3" y="4" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="2"/>
								<path d="M7 11h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
								<path d="M12 8v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
							</svg>
						}
					/>
					<NavButton
						to="/loans"
						label="Microloans"
						active={pathname === '/loans'}
						icon={
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
								<path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
								<circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.3"/>
							</svg>
						}
					/>
					<NavButton
						to="/requests"
						label="Money Requests"
						active={pathname === '/requests'}
						icon={
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
								<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2"/>
								<path d="M8 10h8M8 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
							</svg>
						}
					/>
					<NavButton
						to="/international"
						label="International"
						active={pathname === '/international'}
						icon={
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
								<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
								<path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2"/>
							</svg>
						}
					/>
					<NotificationBell />
				</div>
			</div>
		</nav>
	)
}

