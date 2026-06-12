import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Landing.css";

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const heroBgImage = `${process.env.PUBLIC_URL}/src/bg.png`;

  useEffect(() => {
    if (!loading && user) {
      navigate("/catalog", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) return <div className="loading-screen">Memuat...</div>;

  return (
    <div className="landing-page">
      {/* ===== HERO ===== */}
      <div
        className="landing-hero"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(20,14,6,0.86) 0%, rgba(20,14,6,0.75) 40%, rgba(20,14,6,0.92) 100%), url(${heroBgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="hero-glow-1" aria-hidden="true"></div>
        <div className="hero-glow-2" aria-hidden="true"></div>

        <div className="hero-content">
          <span className="hero-eyebrow">✦ Fashion Rescue Marketplace</span>

          <h1>
            Fashion Worth Wearing <em>Again</em>
          </h1>

          <p className="hero-sub">
            Jual dan beli pakaian pre-loved dengan mudah. Temukan barang
            unik, buka tokomu sendiri, dan kelola pesanan dalam satu
            platform yang dirancang untuk pecinta fashion berkelanjutan.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="btn btn-yellow btn-lg">
              Mulai Belanja
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              Masuk
            </Link>
          </div>

         
        </div>
      </div>

      {/* ===== HOW IT WORKS ===== */}
      <div className="landing-section">
        <div className="section-head">
          <div className="section-eyebrow">Cara Kerja</div>
          <h2>Tiga langkah, tanpa ribet</h2>
          <p>
            Mulai dari menjelajah katalog hingga pakaian sampai di rumahmu —
            semuanya berjalan dalam satu alur yang sederhana.
          </p>
        </div>

        <div className="steps-row">
          <div className="step-card">
            <div className="step-num">01</div>
            <h3>Telusuri & Pilih</h3>
            <p>
              Jelajahi katalog pakaian pre-loved dari berbagai toko,
              saring berdasarkan ukuran, grade, dan harga.
            </p>
          </div>
          <div className="step-card">
            <div className="step-num">02</div>
            <h3>Chat & Pesan</h3>
            <p>
              Tanya langsung ke penjual lewat chat, lalu lakukan
              pemesanan dengan alamat pengiriman lengkap.
            </p>
          </div>
          <div className="step-card">
            <div className="step-num">03</div>
            <h3>Terima & Pakai</h3>
            <p>
              Lacak status pesananmu sampai barang tiba dan siap
              dipakai kembali.
            </p>
          </div>
        </div>
      </div>

      {/* ===== FEATURES ===== */}
      <div className="landing-features-wrap">
        <div className="landing-section">
          <div className="section-head">
            <div className="section-eyebrow">Mengapa PAKAI LAGI</div>
            <h2>Semua yang kamu butuhkan, di satu tempat</h2>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🛒</div>
              <h3>Belanja Mudah</h3>
              <p>
                Telusuri katalog produk pre-loved dari banyak toko
                dengan harga terjangkau dan filter yang lengkap.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏪</div>
              <h3>Buka Toko</h3>
              <p>
                Buat toko baru dalam hitungan menit dan mulai daftarkan
                produkmu ke ribuan pembeli.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📦</div>
              <h3>Pengiriman Cepat</h3>
              <p>
                Kelola alamat dan kirim pesanan dengan data pengiriman
                yang lengkap dan terlacak.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Chat Langsung</h3>
              <p>
                Tanya detail produk langsung ke penjual sebelum
                memutuskan untuk membeli.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FINAL CTA ===== */}
      <div className="landing-cta">
        <div className="cta-box">
          <h2>Siap menyelamatkan <em>gaya lamamu?</em></h2>
          <p>Gabung sekarang dan temukan pakaian pre-loved favoritmu.</p>
          <div className="cta-actions">
            <Link to="/register" className="btn btn-yellow btn-lg">
              Daftar Sekarang
            </Link>
            <Link to="/catalog" className="btn btn-outline btn-lg">
              Lihat Katalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
