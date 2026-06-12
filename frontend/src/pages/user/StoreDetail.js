import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const fmt = (p) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0}).format(p);

export default function StoreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/stores/${id}`),
      api.get(`/products/store/${id}`)
    ]).then(([sr, pr]) => {
      setStore(sr.data);
      setProducts(pr.data);
    }).catch(() => navigate(-1))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-screen">Memuat toko...</div>;
  if (!store) return <div className="empty-state"><h3>Toko tidak ditemukan</h3></div>;

  const logoSrc = store.logo ? (store.logo.startsWith('http') ? store.logo : `${API}${store.logo}`) : null;
  const bannerSrc = store.banner ? (store.banner.startsWith('http') ? store.banner : `${API}${store.banner}`) : null;
  const isOwner = String(store.owner_id) === String(user?.id);

  return (
    <div>
      {/* Banner */}
      <div style={{ height: 200, background: 'linear-gradient(135deg, #111 0%, #333 100%)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: 24, position: 'relative' }}>
        {bannerSrc && <img src={bannerSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>

      {/* Store info */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 32 }}>
        <div style={{ width: 80, height: 80, borderRadius: 16, background: 'var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 32, overflow: 'hidden', flexShrink: 0, border: '3px solid var(--white)', boxShadow: 'var(--shadow)' }}>
          {logoSrc ? <img src={logoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : store.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 6 }}>{store.name}</h1>
          {store.description && <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 10, lineHeight: 1.6 }}>{store.description}</p>}
          <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--gray-400)' }}>
            <span><strong style={{ color: 'var(--black)' }}>{store.total_products || products.length}</strong> Produk</span>
            <span><strong style={{ color: 'var(--black)' }}>{store.total_sold || 0}</strong> Terjual</span>
            {store.address && <span>📍 {store.address}</span>}
          </div>
        </div>
        {isOwner && (
          <Link to="/seller" className="btn btn-outline btn-sm">Kelola Toko</Link>
        )}
      </div>

      {/* Products */}
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
        Produk ({products.length})
      </h2>

      {products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👗</div>
          <h3>Belum ada produk</h3>
          <p>Toko ini belum menambahkan produk</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {products.map(p => {
            const img = p.images?.[0] || '';
            const imgSrc = img.startsWith('http') ? img : `${API}${img}`;
            return (
              <Link key={p._id || p.id} to={`/product/${p._id || p.id}`} className="card" style={{ overflow: 'hidden', color: 'inherit', display: 'block', transition: 'var(--transition)' }}>
                <div style={{ aspectRatio: '3/4', background: 'var(--gray-100)', position: 'relative', overflow: 'hidden' }}>
                  <img src={imgSrc} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'; }} />
                  <span className={`badge badge-${p.grade?.toLowerCase()}`} style={{ position: 'absolute', top: 8, left: 8 }}>Grade {p.grade}</span>
                  {p.status === 'sold' && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13 }}>Terjual</div>}
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>{fmt(p.price)}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
