import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import './Catalog.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const CATS = ['Semua','Atasan','Bawahan','Dress','Outerwear','Aksesoris'];
const SIZES = ['Semua','XS','S','M','L','XL','XXL'];
const GRADES = ['Semua','A','B','C'];

const fmt = (p) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0}).format(p);

function ProductCard({ p }) {
  const img = p.images?.[0] || '';
  const imgSrc = img.startsWith('http') ? img : `${API}${img}`;
  return (
    <Link to={`/product/${p._id || p.id}`} className="prod-card">
      <div className="prod-img">
        <img src={imgSrc} alt={p.name} onError={e => { e.target.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'; }} />
        <span className={`badge badge-${p.grade?.toLowerCase()} prod-grade`}>Grade {p.grade}</span>
        {p.status === 'sold' && <div className="prod-sold-overlay">Terjual</div>}
      </div>
      <div className="prod-info">
        <div className="prod-meta">
          <span>{p.category}</span>
          <span>·</span>
          <span>Size {p.size}</span>
        </div>
        <div className="prod-name">{p.name}</div>
        <div className="prod-bottom">
          <div className="prod-price">{fmt(p.price)}</div>
          {p.store_name && <div className="prod-store">{p.store_name}</div>}
        </div>
      </div>
    </Link>
  );
}

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', size: '', grade: '', search: '' });

  useEffect(() => {
    setLoading(true);
    const p = {};
    if (filters.category && filters.category !== 'Semua') p.category = filters.category;
    if (filters.size && filters.size !== 'Semua') p.size = filters.size;
    if (filters.grade && filters.grade !== 'Semua') p.grade = filters.grade;
    if (filters.search) p.search = filters.search;
    api.get('/products', { params: p })
      .then(r => setProducts(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters]);

  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  return (
    <div className="catalog-page">
      <div className="catalog-hero">
        <h1>Temukan Pakaian <span>Pre-Loved</span></h1>
        <p>Pilihan pakaian berkualitas dari berbagai penjual terpercaya</p>
        <div className="search-wrap">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="#9A9A9A" strokeWidth="1.5"/><path d="M11 11l3 3" stroke="#9A9A9A" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <input className="search-input" placeholder="Cari nama pakaian..." value={filters.search} onChange={e => set('search', e.target.value)} />
          {filters.search && <button className="search-clear" onClick={() => set('search', '')}>✕</button>}
        </div>
      </div>

      <div className="catalog-body">
        <aside className="filter-sidebar">
          <div className="filter-section">
            <div className="filter-title">Kategori</div>
            {CATS.map(c => (
              <button key={c} className={`filter-option ${(filters.category === c || (!filters.category && c === 'Semua')) ? 'active' : ''}`} onClick={() => set('category', c === 'Semua' ? '' : c)}>{c}</button>
            ))}
          </div>
          <div className="filter-section">
            <div className="filter-title">Ukuran</div>
            <div className="size-grid">
              {SIZES.map(s => (
                <button key={s} className={`size-btn ${(filters.size === s || (!filters.size && s === 'Semua')) ? 'active' : ''}`} onClick={() => set('size', s === 'Semua' ? '' : s)}>{s}</button>
              ))}
            </div>
          </div>
          <div className="filter-section">
            <div className="filter-title">Kondisi</div>
            {GRADES.map(g => (
              <button key={g} className={`filter-option ${(filters.grade === g || (!filters.grade && g === 'Semua')) ? 'active' : ''}`} onClick={() => set('grade', g === 'Semua' ? '' : g)}>
                {g === 'Semua' ? 'Semua Grade' : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge badge-${g.toLowerCase()}`}>Grade {g}</span>
                    <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{g === 'A' ? 'Like New' : g === 'B' ? 'Bekas Wajar' : 'Ada Cacat Minor'}</span>
                  </span>
                )}
              </button>
            ))}
          </div>
          {(filters.category || filters.size || filters.grade || filters.search) && (
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setFilters({ category: '', size: '', grade: '', search: '' })}>
              Reset Filter
            </button>
          )}
        </aside>

        <div className="catalog-main">
          {loading ? (
            <div className="loading-screen">Memuat produk...</div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👗</div>
              <h3>Produk tidak ditemukan</h3>
              <p>Coba ubah filter atau kata kunci pencarian</p>
            </div>
          ) : (
            <>
              <div className="catalog-count">{products.length} produk ditemukan</div>
              <div className="products-grid">
                {products.map(p => <ProductCard key={p._id || p.id} p={p} />)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
