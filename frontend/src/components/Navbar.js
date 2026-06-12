import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import "./Navbar.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:8080";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    api
      .get("/chats/unread/count")
      .then((r) => setUnread(r.data.count))
      .catch(() => {});
    const i = setInterval(() => {
      api
        .get("/chats/unread/count")
        .then((r) => setUnread(r.data.count))
        .catch(() => {});
    }, 15000);
    return () => clearInterval(i);
  }, [user]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const avatarSrc = user?.avatar ? `${API}${user.avatar}` : null;

  const navLinks = [
    { to: "/catalog", label: "Katalog" },
    { to: "/stores", label: "Toko" },
    { to: "/chat", label: "Pesan", badge: unread },
    { to: "/orders", label: "Pesananku" },
  ];

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to={user ? "/catalog" : "/"} className="navbar-brand">
          <span className="brand-mark">FR</span>
          <span className="brand-text">Fashion Rescue</span>
        </Link>

        <div className="navbar-links">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`nav-link ${location.pathname === l.to ? "active" : ""}`}
            >
              {l.label}
              {l.badge > 0 && <span className="nav-badge">{l.badge}</span>}
            </Link>
          ))}
        </div>

        <div className="navbar-right" ref={menuRef}>
          {user?.has_store ? (
            <Link
              to="/seller"
              className={`btn btn-sm btn-outline seller-btn ${location.pathname.startsWith("/seller") ? "active" : ""}`}
            >
              Toko Saya
            </Link>
          ) : (
            <Link to="/open-store" className="btn btn-sm btn-yellow">
              Buka Toko
            </Link>
          )}

          <div className="user-trigger" onClick={() => setMenuOpen(!menuOpen)}>
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt=""
                className="avatar avatar-sm"
                style={{ width: 32, height: 32 }}
              />
            ) : (
              <div className="avatar avatar-sm">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="user-trigger-name">
              {user?.name?.split(" ")[0]}
            </span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 4l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {menuOpen && (
            <div className="user-dropdown">
              <div className="dropdown-user">
                <div className="dropdown-name">{user?.name}</div>
                <div className="dropdown-email">{user?.email}</div>
              </div>
              <Link
                to="/profile"
                className="dropdown-item"
                onClick={() => setMenuOpen(false)}
              >
                Profil Saya
              </Link>
              <Link
                to="/settings"
                className="dropdown-item"
                onClick={() => setMenuOpen(false)}
              >
                Pengaturan
              </Link>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={handleLogout}>
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
