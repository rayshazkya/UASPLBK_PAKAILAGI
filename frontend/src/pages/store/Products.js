import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const fmt = (p) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0}).format(p);
const CATS = ['Atasan','Bawahan','Dress','Outerwear','Aksesoris'];
const SIZES = ['XS','S','M','L','XL','XXL','One Size'];
const GRADES = ['A','B','C'];
const EMPTY = { name:'', category:'Atasan', size:'M', grade:'A', price:'', description:'', image_url:'' };

export default function SellerProducts() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    Promise.all([api.get('/seller/products'), api.get('/stores/my')])
      .then(([p, s]) => { setProducts(p.data); setStore(s.data); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, category: p.category, size: p.size, grade: p.grade, price: p.price, description: p.description || '', image_url: p.images?.[0] || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!store) return showToast('Toko tidak ditemukan', 'error');
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      data.append('store_id', store._id || store.id);
      data.append('store_name', store.name);
      if (fileRef.current?.files?.[0]) data.append('images', fileRef.current.files[0]);

      if (editing) {
        await api.put(`/products/${editing._id || editing.id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        showToast('Produk diperbarui', 'success');
      } else {
        await api.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        showToast('Produk ditambahkan', 'success');
      }
      setShowModal(false);
      const p = await api.get('/seller/products');
      setProducts(p.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menyimpan', 'error');
    } finally { setSaving(false); }
  };

  const toggleStatus = async (p) => {
    const newStatus = p.status === 'available' ? 'sold' : 'available';
    try {
      await api.patch(`/products/${p._id || p.id}/status`, { status: newStatus });
      setProducts(prev => prev.map(x => (x._id||x.id) === (p._id||p.id) ? { ...x, status: newStatus } : x));
      showToast('Status diperbarui', 'success');
    } catch { showToast('Gagal mengubah status', 'error'); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/products/${confirmDelete._id || confirmDelete.id}`);
      setProducts(prev => prev.filter(x => (x._id||x.id) !== (confirmDelete._id||confirmDelete.id)));
      showToast('Produk dihapus', 'success');
      setConfirmDelete(null);
    } catch { showToast('Gagal menghapus', 'error'); }
    finally { setDeleting(false); }
  };

  if (loading) return <div className="loading-screen">Memuat produk...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>Produk Saya</h1>
          <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>{products.length} produk</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Tambah Produk</button>
      </div>

      {products.length === 0 ? (
        <div className="empty-state card card-pad">
          <div className="empty-icon">👗</div>
          <h3>Belum ada produk</h3>
          <p>Mulai tambahkan produk untuk dijual</p>
          <button className="btn btn-primary" onClick={openAdd}>Tambah Produk Pertama</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Produk</th><th>Kategori</th><th>Size</th><th>Grade</th><th>Harga</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {products.map(p => {
                const img = p.images?.[0] || '';
                const imgSrc = img.startsWith('http') ? img : img ? `${API}${img}` : '';
                return (
                  <tr key={p._id || p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 52, borderRadius: 6, background: 'var(--gray-100)', overflow: 'hidden', flexShrink: 0 }}>
                          {imgSrc && <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />}
                        </div>
                        <span style={{ fontWeight: 500, fontSize: 14 }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{p.category}</td>
                    <td style={{ fontSize: 13 }}>{p.size}</td>
                    <td><span className={`badge badge-${p.grade?.toLowerCase()}`}>Grade {p.grade}</span></td>
                    <td style={{ fontWeight: 600, fontSize: 14 }}>{fmt(p.price)}</td>
                    <td>
                      <button
                        onClick={() => toggleStatus(p)}
                        className={`badge ${p.status === 'available' ? 'badge-available' : 'badge-sold'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                      >
                        {p.status === 'available' ? 'Tersedia' : 'Terjual'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(p)}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Produk' : 'Tambah Produk'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nama Produk *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Nama pakaian" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>Kategori</label>
                    <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {CATS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Ukuran</label>
                    <select className="form-input" value={form.size} onChange={e => setForm({ ...form, size: e.target.value })}>
                      {SIZES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Grade Kondisi</label>
                    <select className="form-input" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}>
                      {GRADES.map(g => <option key={g} value={g}>Grade {g} {g==='A'?'(Like New)':g==='B'?'(Bekas Wajar)':'(Cacat Minor)'}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Harga (Rp) *</label>
                  <input className="form-input" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required placeholder="85000" min="1000" />
                </div>
                <div className="form-group">
                  <label>Foto Produk</label>
                  <input type="file" accept="image/*" ref={fileRef} className="form-input" style={{ padding: '8px' }} />
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>Atau gunakan URL gambar:</div>
                  <input className="form-input" style={{ marginTop: 6 }} placeholder="https://..." value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Deskripsi</label>
                  <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Kondisi detail, ukuran aktual, bahan, dll..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : (editing ? 'Simpan' : 'Tambah Produk')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title={`Hapus "${confirmDelete?.name}"?`}
        desc="Produk yang dihapus tidak bisa dikembalikan."
        confirmLabel="Ya, Hapus"
        confirmClass="btn btn-danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        loading={deleting}
      />
    </div>
  );
}
