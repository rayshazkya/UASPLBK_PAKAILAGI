import React, { useState, useRef } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '', bio: user?.bio || '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const avatarSrc = user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${API}${user.avatar}`) : null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/profile', form);
      await refreshUser();
      showToast('Profil berhasil disimpan', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menyimpan', 'error');
    } finally { setSaving(false); }
  };

  const handleAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) return showToast('Ukuran foto maksimal 3MB', 'error');
    const data = new FormData();
    data.append('avatar', file);
    setUploading(true);
    try {
      await api.post('/auth/avatar', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser();
      showToast('Foto profil diperbarui', 'success');
    } catch { showToast('Gagal upload foto', 'error'); }
    finally { setUploading(false); }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="page-header">
        <h1>Profil Saya</h1>
        <p>Kelola informasi pribadi kamu</p>
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            <div className="avatar avatar-xl" style={{ cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
              {avatarSrc ? <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : user?.name?.[0]?.toUpperCase()}
            </div>
            <button
              style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: 'var(--black)', color: 'var(--white)', border: '2px solid var(--white)', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? '...' : '✎'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>{user?.name}</div>
            <div style={{ fontSize: 14, color: 'var(--gray-400)', marginTop: 2 }}>{user?.email}</div>
            {user?.has_store && <span className="badge" style={{ background: 'var(--yellow-light)', color: '#b45309', marginTop: 6, display: 'inline-flex' }}>Penjual</span>}
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label>Nama Lengkap</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Nomor HP</label>
            <input className="form-input" placeholder="08xxxxxxxxxx" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Alamat</label>
            <input className="form-input" placeholder="Kota, Provinsi" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Bio</label>
            <textarea className="form-input" rows={3} placeholder="Ceritakan sedikit tentang dirimu..." value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
