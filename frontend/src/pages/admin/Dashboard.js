import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const fmt = (p) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0}).format(p||0);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [stores, setStores] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/stores'),
      api.get('/auth/admin/users')
    ]).then(([s, st, u]) => {
      setStats(s.data);
      setStores(st.data);
      setUsers(u.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen">Memuat...</div>;

  const cards = [
    { label: 'Total Pengguna', value: users.length, icon: '◉', bg: '#dbeafe', color: '#1d4ed8' },
    { label: 'Total Toko', value: stores.length, icon: '◫', bg: 'var(--orange-light)', color: '#b45309' },
    { label: 'Total Pesanan', value: stats?.totalOrders || 0, icon: '◎', bg: 'var(--green-light)', color: '#15803d' },
    { label: 'Total Pendapatan', value: fmt(stats?.revenue), icon: '₨', bg: 'var(--yellow-light)', color: '#b45309' },
  ];

  return (
    <div>
      <div className="page-header"><h1>Dashboard Admin</h1><p>Overview platform Fashion Rescue</p></div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:32 }}>
        {cards.map((c,i) => (
          <div key={i} className="card card-pad">
            <div style={{ width:40, height:40, borderRadius:8, background:c.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, marginBottom:12 }}>{c.icon}</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:700, marginBottom:4 }}>{c.value}</div>
            <div style={{ fontSize:13, color:'var(--gray-400)' }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* Recent stores */}
        <div className="card">
          <div style={{ padding:'16px 20px', borderBottom:'1.5px solid var(--gray-200)' }}>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15 }}>Toko Terbaru</div>
          </div>
          {stores.slice(0,6).map(s => (
            <div key={s._id||s.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 20px', borderBottom:'1px solid var(--gray-100)' }}>
              <div style={{ width:36, height:36, borderRadius:8, background:'var(--yellow)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, flexShrink:0 }}>
                {s.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.name}</div>
                <div style={{ fontSize:12, color:'var(--gray-400)' }}>{s.total_products||0} produk · {s.total_sold||0} terjual</div>
              </div>
              <span className={`badge ${s.is_active ? 'badge-available' : 'badge-sold'}`}>{s.is_active ? 'Aktif' : 'Nonaktif'}</span>
            </div>
          ))}
          {stores.length === 0 && <div style={{ padding:'24px', textAlign:'center', color:'var(--gray-400)', fontSize:13 }}>Belum ada toko</div>}
        </div>

        {/* Recent users */}
        <div className="card">
          <div style={{ padding:'16px 20px', borderBottom:'1.5px solid var(--gray-200)' }}>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15 }}>Pengguna Terbaru</div>
          </div>
          {users.slice(0,6).map(u => (
            <div key={u._id||u.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 20px', borderBottom:'1px solid var(--gray-100)' }}>
              <div className="avatar avatar-sm">{u.name?.[0]?.toUpperCase()}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:600 }}>{u.name}</div>
                <div style={{ fontSize:12, color:'var(--gray-400)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{u.email}</div>
              </div>
              {u.has_store && <span className="badge" style={{ background:'var(--yellow-light)', color:'#b45309' }}>Penjual</span>}
            </div>
          ))}
          {users.length === 0 && <div style={{ padding:'24px', textAlign:'center', color:'var(--gray-400)', fontSize:13 }}>Belum ada pengguna</div>}
        </div>
      </div>
    </div>
  );
}
