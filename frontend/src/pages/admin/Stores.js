import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';

const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});

export default function AdminStores() {
  const { showToast } = useToast();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    api.get('/admin/stores').then(r => setStores(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleToggle = async () => {
    if (!confirm) return;
    setToggling(true);
    try {
      const r = await api.patch(`/admin/stores/${confirm._id||confirm.id}/toggle`);
      setStores(prev => prev.map(s => (s._id||s.id) === (confirm._id||confirm.id) ? { ...s, is_active: r.data.is_active } : s));
      showToast(r.data.message, 'success');
      setConfirm(null);
    } catch { showToast('Gagal mengubah status', 'error'); }
    finally { setToggling(false); }
  };

  if (loading) return <div className="loading-screen">Memuat toko...</div>;

  return (
    <div>
      <div className="page-header"><h1>Manajemen Toko</h1><p>{stores.length} toko terdaftar</p></div>

      {stores.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🏪</div><h3>Belum ada toko</h3></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Toko</th><th>Pemilik</th><th>Produk</th><th>Terjual</th><th>Tanggal Daftar</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {stores.map(s => (
                <tr key={s._id||s.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:36, height:36, borderRadius:8, background:'var(--yellow)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, flexShrink:0 }}>
                        {s.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:14 }}>{s.name}</div>
                        {s.address && <div style={{ fontSize:12, color:'var(--gray-400)' }}>{s.address}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize:13 }}>{s.owner_name}</td>
                  <td style={{ fontSize:14, fontWeight:500 }}>{s.total_products||0}</td>
                  <td style={{ fontSize:14, fontWeight:500 }}>{s.total_sold||0}</td>
                  <td style={{ fontSize:13, color:'var(--gray-400)' }}>{fmtDate(s.createdAt)}</td>
                  <td><span className={`badge ${s.is_active ? 'badge-available' : 'badge-sold'}`}>{s.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                  <td>
                    <button
                      className={`btn btn-sm ${s.is_active ? 'btn-danger' : 'btn-outline'}`}
                      onClick={() => setConfirm(s)}
                    >
                      {s.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={!!confirm}
        title={confirm?.is_active ? `Nonaktifkan "${confirm?.name}"?` : `Aktifkan "${confirm?.name}"?`}
        desc={confirm?.is_active ? 'Toko tidak akan muncul di halaman publik.' : 'Toko akan kembali aktif dan terlihat oleh pembeli.'}
        confirmLabel={confirm?.is_active ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
        confirmClass={`btn ${confirm?.is_active ? 'btn-danger' : 'btn-primary'}`}
        onConfirm={handleToggle}
        onCancel={() => setConfirm(null)}
        loading={toggling}
      />
    </div>
  );
}
