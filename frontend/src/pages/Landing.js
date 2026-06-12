import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/catalog", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) return <div className="loading-screen">Memuat...</div>;

  return (
    <div className="landing-page">
      <div
        className="landing-hero"
        style={{ textAlign: "center", padding: "100px 16px" }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div
            style={{
              fontSize: 18,
              color: "var(--yellow-700)",
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            Fashion Rescue
          </div>
          <h1 style={{ fontSize: 44, margin: "0 0 16px", lineHeight: 1.05 }}>
            Jual dan beli pakaian pre-loved dengan mudah
          </h1>
          <p
            style={{ fontSize: 18, color: "var(--gray-600)", marginBottom: 32 }}
          >
            Temukan pakaian unik, buka toko, dan kirim pesanan dengan cepat di
            satu platform.
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Link to="/login" className="btn btn-primary btn-lg">
              Masuk
            </Link>
            <Link to="/register" className="btn btn-outline btn-lg">
              Daftar
            </Link>
          </div>
        </div>
      </div>

      <div
        className="landing-features"
        style={{
          maxWidth: 960,
          margin: "0 auto",
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        }}
      >
        <div className="card card-pad" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🛒</div>
          <h3>Belanja Mudah</h3>
          <p>
            Telusuri katalog produk pre-loved dari banyak toko dengan harga
            terjangkau.
          </p>
        </div>
        <div className="card card-pad" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏪</div>
          <h3>Buka Toko</h3>
          <p>Buat toko baru dalam hitungan menit dan mulai daftar produkmu.</p>
        </div>
        <div className="card card-pad" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📦</div>
          <h3>Pengiriman Cepat</h3>
          <p>Kelola alamat dan kirim pesanan dengan data pengiriman lengkap.</p>
        </div>
      </div>
    </div>
  );
}
