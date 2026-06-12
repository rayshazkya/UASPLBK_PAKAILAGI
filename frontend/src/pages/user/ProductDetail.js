import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';
import './ProductDetail.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const fmt = (p) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0}).format(p);

const GRADE_INFO = {
  A: { label: 'Like New', desc: 'Kondisi sangat baik, hampir seperti baru.', cls: 'badge-a' },
  B: { label: 'Bekas Wajar', desc: 'Bekas pemakaian normal, kondisi baik.', cls: 'badge-b' },
  C: { label: 'Ada Cacat Minor', desc: 'Terdapat sedikit cacat kecil, harga disesuaikan.', cls: 'badge-c' }
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [product, setProduct] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [confirmBuy, setConfirmBuy] = useState(false);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(async r => {
        setProduct(r.data);
        if (r.data.store_id) {
          try {
            const s = await api.get(`/stores/${r.data.store_id}`);
            setStore(s.data);
          } catch {}
        }
      })
      .catch(() => showToast('Produk tidak ditemukan', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChat = async () => {
    if (!product) return;
    const sellerId = product.owner_id;
    if (String(sellerId) === String(user.id)) return showToast('Ini produk kamu sendiri', 'warning');
    try {
      await api.post('/chats', {
        receiver_id: sellerId,
        receiver_name: product.owner_name,
        message: `Halo, saya tertarik dengan "${product.name}". Apakah masih tersedia?`,
        product_id: product._id || product.id,
        product_name: product.name,
        product_image: product.images?.[0] || ''
      });
      navigate(`/chat/${sellerId}`);
    } catch { showToast('Gagal membuka chat', 'error'); }
  };

  const handleBuy = () => {
    setConfirmBuy(false);
    navigate(`/checkout/${product._id || product.id}`);
  };

  if (loading) return <div className="loading-screen">Memuat produk...</div>;
  if (!product) return <div className="empty-state"><h3>Produk tidak ditemukan</h3></div>;

  const images = product.images?.length > 0 ? product.images : ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'];
  const grade = GRADE_INFO[product.grade] || GRADE_INFO.A;
  const isOwn = String(product.owner_id) === String(user?.id);

  return (
    <div className="detail-page">
      <div className="detail-breadcrumb">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Kembali</button>
        {store && <><span style={{ color: 'var(--gray-300)' }}>·</span><Link to={`/stores/${store._id || store.id}`} style={{ fontSize: 13, color: 'var(--gray-500)' }}>{store.name}</Link></>}
      </div>

      <div className="detail-grid">
        <div className="detail-images">
          <div className="main-img">
            <img
              src={images[activeImg].startsWith('http') ? images[activeImg] : `${API}${images[activeImg]}`}
              alt={product.name}
              onError={e => { e.target.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'; }}
            />
            {product.status === 'sold' && <div className="sold-overlay">Terjual</div>}
          </div>
          {images.length > 1 && (
            <div className="thumb-row">
              {images.map((img, i) => (
                <button key={i} className={`thumb ${activeImg === i ? 'active' : ''}`} onClick={() => setActiveImg(i)}>
                  <img src={img.startsWith('http') ? img : `${API}${img}`} alt="" onError={e => { e.target.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100'; }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-info">
          <div className="detail-top">
            <div className="detail-badges">
              <span className={`badge ${grade.cls}`}>Grade {product.grade} · {grade.label}</span>
              <span className={`badge ${product.status === 'available' ? 'badge-available' : 'badge-sold'}`}>
                {product.status === 'available' ? 'Tersedia' : 'Terjual'}
              </span>
            </div>
            <h1 className="detail-name">{product.name}</h1>
            <div className="detail-price">{fmt(product.price)}</div>
            <div className="detail-specs">
              <div className="spec-item"><span>Kategori</span><strong>{product.category}</strong></div>
              <div className="spec-item"><span>Ukuran</span><strong>{product.size}</strong></div>
              <div className="spec-item"><span>Kondisi</span><strong>{grade.label}</strong></div>
            </div>
          </div>

          {product.description && (
            <div className="detail-desc">
              <div className="detail-section-title">Deskripsi</div>
              <p>{product.description}</p>
            </div>
          )}

          {store && (
            <Link to={`/stores/${store._id || store.id}`} className="detail-store">
              <div className="store-logo-sm">
                {store.logo ? <img src={store.logo.startsWith('http') ? store.logo : `${API}${store.logo}`} alt="" /> : <span>{store.name?.[0]?.toUpperCase()}</span>}
              </div>
              <div>
                <div className="store-link-name">{store.name}</div>
                <div className="store-link-sub">Lihat toko →</div>
              </div>
            </Link>
          )}

          {!isOwn && product.status === 'available' && (
            <div className="detail-actions">
              <button className="btn btn-outline" onClick={handleChat}>Hubungi Penjual</button>
              <button className="btn btn-yellow" onClick={() => setConfirmBuy(true)}>
                Beli Sekarang
              </button>
            </div>
          )}
          {isOwn && <div style={{ fontSize: 13, color: 'var(--gray-400)', padding: '12px', background: 'var(--gray-100)', borderRadius: 'var(--radius)', textAlign: 'center' }}>Ini produk milik kamu</div>}
          {product.status === 'sold' && !isOwn && <div style={{ fontSize: 14, color: 'var(--gray-500)', padding: '14px', background: 'var(--gray-100)', borderRadius: 'var(--radius)', textAlign: 'center', fontWeight: 500 }}>Produk ini sudah terjual</div>}
        </div>
      </div>

      <ConfirmModal
        open={confirmBuy}
        title="Konfirmasi Pembelian"
        desc={`Beli "${product.name}" seharga ${fmt(product.price)}?`}
        confirmLabel="Ya, Lanjut ke Checkout"
        confirmClass="btn btn-yellow"
        onConfirm={handleBuy}
        onCancel={() => setConfirmBuy(false)}
      />
    </div>
  );
}