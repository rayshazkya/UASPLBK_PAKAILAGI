import React, { useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../../components/ConfirmModal';

export default function Settings() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) return showToast('Konfirmasi password tidak cocok', 'error');
    if (pwForm.new_password.length < 6) return showToast('Password baru minimal 6 karakter', 'error');
    setSaving(true);
    try {
      await api.put('/auth/password', { old_password: pwForm.old_password, new_password: pwForm.new_password });
      showToast('Password berhasil diubah', 'success');
      setPwForm({ old_password: '', new_password: '', confirm: '' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal mengubah password', 'error');
    } finally { setSaving(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <div className="page-header">
        <h1>Pengaturan</h1>
        <p>Kelola akun dan keamanan kamu</p>
      </div>

      {/* Account info */}
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Informasi Akun</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[['Nama', user?.name], ['Email', user?.email], ['Role', user?.role === 'admin' ? 'Administrator' : user?.has_store ? 'Pembeli & Penjual' : 'Pembeli']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
              <span style={{ color: 'var(--gray-500)' }}>{k}</span>
              <span style={{ fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Change password */}
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Ubah Password</div>
        <form onSubmit={handlePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label>Password Lama</label>
            <input className="form-input" type="password" value={pwForm.old_password} onChange={e => setPwForm({ ...pwForm, old_password: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Password Baru</label>
            <input className="form-input" type="password" placeholder="Minimal 6 karakter" value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Konfirmasi Password Baru</label>
            <input className="form-input" type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} required />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Ubah Password'}</button>
          </div>
        </form>
      </div>

      {/* Danger zone */}
      <div className="card card-pad" style={{ border: '1.5px solid var(--red-light)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 6, color: 'var(--red)' }}>Zona Berbahaya</div>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 14 }}>Tindakan di bawah ini tidak bisa dibatalkan.</p>
        <button className="btn btn-danger" onClick={() => setConfirmLogout(true)}>Keluar dari Semua Perangkat</button>
      </div>

      <ConfirmModal
        open={confirmLogout}
        title="Keluar dari akun?"
        desc="Kamu akan keluar dan perlu login kembali."
        confirmLabel="Ya, Keluar"
        confirmClass="btn btn-danger"
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}
