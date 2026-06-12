import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return showToast('Password minimal 6 karakter', 'error');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      showToast('Akun berhasil dibuat!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Registrasi gagal', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo-wrap">
          <div className="auth-logo">FR</div>
        </div>
        <h1 className="auth-title">Buat Akun Baru</h1>
        <p className="auth-sub">Bergabung dan temukan pakaian pre-loved terbaik</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Nama Lengkap</label>
            <input className="form-input" type="text" placeholder="Nama kamu" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-input" type="email" placeholder="email@contoh.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-input" type="password" placeholder="Minimal 6 karakter" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop: 4 }} disabled={loading}>
            {loading ? 'Mendaftar...' : 'Daftar'}
          </button>
        </form>

        <p className="auth-footer">Sudah punya akun? <Link to="/login">Masuk</Link></p>
      </div>
    </div>
  );
}
