import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const fmt = (p) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0}).format(p);

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/products').then(r => setProducts(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.store_name||'').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading-screen">Memuat produk...</div>;

  return (
    <div>
      <div className="page-header"><h1>Semua Produk</h1><p>{products.length} produk di platform</p></div>

      <div style={{ marginBottom:20, maxWidth:320 }}>
        <input className="form-input" placeholder="Cari nama produk atau toko..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Produk</th><th>Toko</th><th>Grade</th><th>Harga</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map(p => {
              const img = p.images?.[0]||'';
              const imgSrc = img.startsWith('http') ? img : img ? `${API}${img}` : '';
              return (
                <tr key={p._id||p.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:38, height:48, borderRadius:6, background:'var(--gray-100)', overflow:'hidden', flexShrink:0 }}>
                        {imgSrc && <img src={imgSrc} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display='none'; }} />}
                      </div>
                      <div>
                        <div style={{ fontWeight:500, fontSize:14 }}>{p.name}</div>
                        <div style={{ fontSize:12, color:'var(--gray-400)' }}>Size {p.size} · {p.category}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize:13 }}>{p.store_name||'-'}</td>
                  <td><span className={`badge badge-${p.grade?.toLowerCase()}`}>Grade {p.grade}</span></td>
                  <td style={{ fontWeight:600 }}>{fmt(p.price)}</td>
                  <td><span className={`badge ${p.status==='available' ? 'badge-available' : 'badge-sold'}`}>{p.status==='available' ? 'Tersedia' : 'Terjual'}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
