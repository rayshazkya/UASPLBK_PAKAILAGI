import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminLayout.css';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: '▤' },
  { to: '/admin/stores', label: 'Toko', icon: '◫' },
  { to: '/admin/users', label: 'Pengguna', icon: '◉' },
  { to: '/admin/products', label: 'Produk', icon: '◈' },
  { to: '/admin/orders', label: 'Pesanan', icon: '◎' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="brand-mark">FR</div>
          <div>
            <div className="brand-text">Fashion Rescue</div>
            <div className="brand-sub">Admin Panel</div>
          </div>
        </div>

        <nav className="admin-nav">
          {NAV.map(n => (
            <Link
              key={n.to}
              to={n.to}
              className={`admin-nav-link ${location.pathname === n.to ? 'active' : ''}`}
            >
              <span>{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <div className="avatar avatar-sm">{user?.name?.[0]?.toUpperCase()}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Administrator</div>
            </div>
          </div>
          <button className="admin-logout" onClick={() => { logout(); navigate('/login'); }}>Keluar</button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
