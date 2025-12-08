import { Link, useLocation } from 'react-router-dom'

export default function Nav() {
	const { pathname } = useLocation()
	return (
		<nav className="nav">
			<div className="brand">Internet Banking</div>
			<div className="links">
				<Link className={pathname === '/' ? 'active' : ''} to="/">Card Top-up</Link>
				<Link className={pathname === '/bank' ? 'active' : ''} to="/bank">Bank Top-up</Link>
				<Link className={pathname === '/prepaid' ? 'active' : ''} to="/prepaid">Prepaid/Gift</Link>
				<Link className={pathname === '/loans' ? 'active' : ''} to="/loans">Microloans</Link>
				<Link className={pathname === '/requests' ? 'active' : ''} to="/requests">Money Requests</Link>
			</div>
		</nav>
	)
}


