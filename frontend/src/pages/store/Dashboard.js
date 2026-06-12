import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const fmt = (p) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0}).format(p||0);

export default function SellerDashboard() {
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/stores/my'),
      api.get('/seller/products'),
      api.get('/payments/seller-orders')
    ]).then(([s, p, o]) => {
      setStore(s.data);
      setProducts(p.data);
      setOrders(o.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen">Memuat...</div>;

  const totalRevenue = orders.filter(o => o.status === 'paid').reduce((s, o) => s + parseFloat(o.amount), 0);
  const available = products.filter(p => p.status === 'available').length;
  const sold = products.filter(p => p.status === 'sold').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{store?.name || 'Toko Saya'}</h1>
          <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>Dashboard penjual</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/seller/products" className="btn btn-primary">+ Tambah Produk</Link>
          <Link to="/seller/settings" className="btn btn-outline">Pengaturan Toko</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Produk', value: products.length, icon: '◫', bg: '#f0f0f0' },
          { label: 'Tersedia', value: available, icon: '◉', bg: 'var(--green-light)' },
          { label: 'Terjual', value: sold, icon: '◎', bg: 'var(--orange-light)' },
          { label: 'Total Pendapatan', value: fmt(totalRevenue), icon: '₨', bg: 'var(--yellow-light)', wide: true }
        ].map((s, i) => (
          <div key={i} className="card card-pad">
            <div style={{ width: 38, height: 38, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 12 }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: s.wide ? 18 : 24, fontWeight: 700, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1.5px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>Produk Terbaru</div>
            <Link to="/seller/products" style={{ fontSize: 13, color: 'var(--gray-400)' }}>Lihat semua →</Link>
          </div>
          {products.slice(0, 5).map(p => (
            <div key={p._id || p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--gray-100)' }}>
              <div style={{ width: 40, height: 50, borderRadius: 6, background: 'var(--gray-100)', overflow: 'hidden', flexShrink: 0 }}>
                {p.images?.[0] && <img src={p.images[0].startsWith('http') ? p.images[0] : `${process.env.REACT_APP_API_URL}${p.images[0]}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{fmt(p.price)}</div>
              </div>
              <span className={`badge ${p.status === 'available' ? 'badge-available' : 'badge-sold'}`}>{p.status === 'available' ? 'Tersedia' : 'Terjual'}</span>
            </div>
          ))}
          {products.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>Belum ada produk</div>}
        </div>

        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1.5px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>Pesanan Masuk</div>
            <Link to="/seller/orders" style={{ fontSize: 13, color: 'var(--gray-400)' }}>Lihat semua →</Link>
          </div>
          {orders.slice(0, 5).map(o => (
            <div key={o._id || o.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{o.product_name}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{o.buyer_name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{fmt(o.amount)}</div>
                <span className={`badge badge-${o.status}`}>{o.status === 'paid' ? 'Lunas' : o.status === 'pending' ? 'Menunggu' : 'Gagal'}</span>
              </div>
            </div>
          ))}
          {orders.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>Belum ada pesanan</div>}
        </div>
      </div>
    </div>
  );
}
