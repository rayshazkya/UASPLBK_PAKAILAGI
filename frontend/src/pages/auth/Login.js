import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './Auth.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      const message = err.response?.data?.message
        || (err.message?.includes('Network') ? 'Tidak dapat terhubung ke server. Jalankan backend terlebih dahulu.' : 'Login gagal');
      console.error('Login error:', err);
      showToast(message, 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo-wrap">
          <img src="/src/image.png" alt="PakaiLagi Logo" className="auth-logo" />
        </div>
        <h1 className="auth-title">Masuk ke PAKAI LAGI</h1>
        <p className="auth-sub">Platform pakaian pre-loved</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input className="form-input" type="email" placeholder="email@contoh.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-input" type="password" placeholder="Password kamu" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop: 4 }} disabled={loading}>
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>

        <p className="auth-footer">Belum punya akun? <Link to="/register">Daftar sekarang</Link></p>

      
      </div>
    </div>
  );
}
