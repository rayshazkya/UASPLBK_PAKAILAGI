import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export default function StoreList() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/stores', { params: search ? { search } : {} })
      .then(r => setStores(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div>
      <div className="page-header">
        <h1>Daftar Toko</h1>
        <p>Temukan toko pakaian pre-loved favoritmu</p>
      </div>

      <div style={{ marginBottom: 24, maxWidth: 360 }}>
        <input className="form-input" placeholder="Cari nama toko..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <div className="loading-screen">Memuat toko...</div> : stores.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏪</div>
          <h3>Belum ada toko</h3>
          <p>Jadilah yang pertama membuka toko di Fashion Rescue</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {stores.map(store => {
            const logoSrc = store.logo ? (store.logo.startsWith('http') ? store.logo : `${API}${store.logo}`) : null;
            const bannerSrc = store.banner ? (store.banner.startsWith('http') ? store.banner : `${API}${store.banner}`) : null;
            return (
              <Link key={store._id || store.id} to={`/stores/${store._id || store.id}`} className="card" style={{ overflow: 'hidden', color: 'inherit', transition: 'var(--transition)' }}>
                <div style={{ height: 90, background: 'var(--gray-100)', position: 'relative', overflow: 'hidden' }}>
                  {bannerSrc && <img src={bannerSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  {!bannerSrc && <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #111 0%, #333 100%)' }} />}
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, overflow: 'hidden', flexShrink: 0, border: '2px solid var(--white)', marginTop: -22 }}>
                      {logoSrc ? <img src={logoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : store.name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{store.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{store.total_products || 0} produk</div>
                    </div>
                  </div>
                  {store.description && <p style={{ fontSize: 13, color: 'var(--gray-500)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{store.description}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
