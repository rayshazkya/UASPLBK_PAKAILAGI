import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/auth/admin/users').then(r => setUsers(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading-screen">Memuat pengguna...</div>;

  return (
    <div>
      <div className="page-header"><h1>Manajemen Pengguna</h1><p>{users.length} pengguna terdaftar</p></div>

      <div style={{ marginBottom:20, maxWidth:320 }}>
        <input className="form-input" placeholder="Cari nama atau email..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">👥</div><h3>Pengguna tidak ditemukan</h3></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Pengguna</th><th>Email</th><th>Status</th><th>Tanggal Daftar</th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id||u.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div className="avatar avatar-sm">{u.name?.[0]?.toUpperCase()}</div>
                      <span style={{ fontWeight:500, fontSize:14 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize:13, color:'var(--gray-500)' }}>{u.email}</td>
                  <td>
                    {u.has_store
                      ? <span className="badge" style={{ background:'var(--yellow-light)', color:'#b45309' }}>Penjual</span>
                      : <span className="badge" style={{ background:'var(--gray-100)', color:'var(--gray-500)' }}>Pembeli</span>
                    }
                  </td>
                  <td style={{ fontSize:13, color:'var(--gray-400)' }}>{fmtDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
