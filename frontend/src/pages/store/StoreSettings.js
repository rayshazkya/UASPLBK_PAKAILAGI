import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export default function SellerSettings() {
  const { showToast } = useToast();
  const [store, setStore] = useState(null);
  const [form, setForm] = useState({ name:'', description:'', address:'', phone:'' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const logoRef = useRef();
  const bannerRef = useRef();

  useEffect(() => {
    api.get('/stores/my').then(r => {
      setStore(r.data);
      setForm({ name: r.data.name||'', description: r.data.description||'', address: r.data.address||'', phone: r.data.phone||'' });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.put('/stores/my', form);
      setStore(r.data);
      showToast('Pengaturan toko disimpan', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menyimpan', 'error');
    } finally { setSaving(false); }
  };

  const uploadImage = async (type, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return showToast('Ukuran file maksimal 5MB', 'error');
    const data = new FormData();
    data.append(type, file);
    try {
      const r = await api.post(`/stores/my/${type}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setStore(prev => ({ ...prev, [type]: r.data[type] }));
      showToast(`${type === 'logo' ? 'Logo' : 'Banner'} berhasil diperbarui`, 'success');
    } catch { showToast('Gagal upload', 'error'); }
  };

  if (loading) return <div className="loading-screen">Memuat...</div>;

  const logoSrc = store?.logo ? (store.logo.startsWith('http') ? store.logo : `${API}${store.logo}`) : null;
  const bannerSrc = store?.banner ? (store.banner.startsWith('http') ? store.banner : `${API}${store.banner}`) : null;

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="page-header"><h1>Pengaturan Toko</h1><p>Kelola tampilan dan informasi toko kamu</p></div>

      {/* Banner */}
      <div className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ height: 140, background: bannerSrc ? 'transparent' : 'linear-gradient(135deg, #111, #333)', position: 'relative', overflow: 'hidden', cursor: 'pointer' }} onClick={() => bannerRef.current?.click()}>
          {bannerSrc && <img src={bannerSrc} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:13, fontWeight:600, opacity: bannerSrc ? 0 : 1, transition:'opacity 0.2s' }} className="banner-hover-text">
            Klik untuk ubah banner
          </div>
        </div>
        <input ref={bannerRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => uploadImage('banner', e.target.files[0])} />

        <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:64, height:64, borderRadius:12, background:'var(--yellow)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:24, overflow:'hidden', border:'2px solid var(--white)', boxShadow:'var(--shadow)', cursor:'pointer', flexShrink:0 }} onClick={() => logoRef.current?.click()}>
            {logoSrc ? <img src={logoSrc} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : store?.name?.[0]?.toUpperCase()}
          </div>
          <input ref={logoRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => uploadImage('logo', e.target.files[0])} />
          <div>
            <div style={{ fontWeight:700, fontSize:16 }}>{store?.name}</div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop:4 }} onClick={() => logoRef.current?.click()}>Ubah Logo</button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card card-pad">
        <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15, marginBottom:16 }}>Informasi Toko</div>
        <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="form-group">
            <label>Nama Toko *</label>
            <input className="form-input" value={form.name} onChange={e => setForm({...form, name:e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Deskripsi</label>
            <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({...form, description:e.target.value})} placeholder="Ceritakan tentang tokomu..." />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="form-group">
              <label>Alamat</label>
              <input className="form-input" value={form.address} onChange={e => setForm({...form, address:e.target.value})} placeholder="Kota, Provinsi" />
            </div>
            <div className="form-group">
              <label>Nomor HP</label>
              <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} placeholder="08xxxxxxxxxx" />
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:4 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
