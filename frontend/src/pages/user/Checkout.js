import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utils/api";
import { useToast } from "../../context/ToastContext";

const fmt = (p) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(p);

const API = process.env.REACT_APP_API_URL || "http://localhost:8080";

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    shipping_name: "",
    shipping_phone: "",
    shipping_address: "",
    shipping_city: "",
    shipping_notes: "",
    payment_method: "transfer",
    bank_name: "bca",
  });

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch(() => showToast("Produk tidak ditemukan", "error"))
      .finally(() => setLoading(false));
  }, [id, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.shipping_name.trim())
      return showToast("Nama penerima wajib diisi", "error");
    if (!form.shipping_phone.trim())
      return showToast("No. telepon wajib diisi", "error");
    if (!form.shipping_address.trim())
      return showToast("Alamat lengkap wajib diisi", "error");
    if (!form.shipping_city.trim())
      return showToast("Kota / kabupaten wajib diisi", "error");
    if (form.payment_method === "transfer" && !form.bank_name)
      return showToast("Pilih bank tujuan transfer", "error");

    setSubmitting(true);
    try {
      await api.post("/payments/checkout", {
        product_id: id,
        ...form,
      });
      showToast("Checkout berhasil! Pesanan kamu sedang diproses.", "success");
      navigate("/orders");
    } catch (err) {
      showToast(err.response?.data?.message || "Gagal checkout", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-screen">Memuat checkout...</div>;
  if (!product)
    return (
      <div className="empty-state">
        <h3>Produk tidak ditemukan</h3>
      </div>
    );

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="page-header">
        <h1>Checkout</h1>
        <p>Lengkapi data pengiriman dan pilih metode pembayaran.</p>
      </div>

      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "120px 1fr",
            alignItems: "center",
          }}
        >
          <img
            src={
              product.images?.[0]
                ? product.images[0].startsWith("http")
                  ? product.images[0]
                  : `${API}${product.images[0]}`
                : "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200"
            }
            alt={product.name}
            style={{
              width: 120,
              height: 120,
              objectFit: "cover",
              borderRadius: 14,
              background: "var(--gray-100)",
            }}
            onError={(e) => {
              e.target.src =
                "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200";
            }}
          />
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{product.name}</div>
            <div style={{ marginTop: 6, color: "var(--gray-500)" }}>
              {product.store_name}
            </div>
            <div style={{ marginTop: 12, fontSize: 20, fontWeight: 700 }}>
              {fmt(product.price)}
            </div>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="card card-pad"
        style={{ display: "grid", gap: 18 }}
      >
        <div className="form-group">
          <label>
            Nama Penerima <span style={{ color: "var(--red)" }}>*</span>
          </label>
          <input
            className="form-input"
            value={form.shipping_name}
            onChange={(e) =>
              setForm({ ...form, shipping_name: e.target.value })
            }
            placeholder="Nama lengkap penerima"
            required
          />
        </div>
        <div className="form-group">
          <label>
            Nomor HP / WhatsApp <span style={{ color: "var(--red)" }}>*</span>
          </label>
          <input
            className="form-input"
            value={form.shipping_phone}
            onChange={(e) =>
              setForm({ ...form, shipping_phone: e.target.value })
            }
            placeholder="08xxxxxxxxxx"
            required
          />
        </div>
        <div className="form-group">
          <label>
            Alamat Lengkap <span style={{ color: "var(--red)" }}>*</span>
          </label>
          <textarea
            className="form-input"
            rows={3}
            value={form.shipping_address}
            onChange={(e) =>
              setForm({ ...form, shipping_address: e.target.value })
            }
            placeholder="Alamat jalan, nomor rumah, rt/rw"
            required
          />
        </div>
        <div className="form-group">
          <label>
            Kota / Kabupaten <span style={{ color: "var(--red)" }}>*</span>
          </label>
          <input
            className="form-input"
            value={form.shipping_city}
            onChange={(e) =>
              setForm({ ...form, shipping_city: e.target.value })
            }
            placeholder="Contoh: Bandung"
            required
          />
        </div>
        <div className="form-group">
          <label>Catatan Pengiriman</label>
          <textarea
            className="form-input"
            rows={2}
            value={form.shipping_notes}
            onChange={(e) =>
              setForm({ ...form, shipping_notes: e.target.value })
            }
            placeholder="Contoh: antar ke satpam, call sebelum kirim"
          />
        </div>
        <div className="form-group">
          <label>
            Metode Pembayaran <span style={{ color: "var(--red)" }}>*</span>
          </label>
          <div style={{ display: "grid", gap: 10 }}>
            <label className="radio-label">
              <input
                type="radio"
                name="payment_method"
                value="transfer"
                checked={form.payment_method === "transfer"}
                onChange={() =>
                  setForm({ ...form, payment_method: "transfer" })
                }
              />{" "}
              Transfer Bank
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="payment_method"
                value="cod"
                checked={form.payment_method === "cod"}
                onChange={() => setForm({ ...form, payment_method: "cod" })}
              />{" "}
              Bayar di Tempat (COD)
            </label>
          </div>
        </div>
        {form.payment_method === "transfer" && (
          <div className="form-group">
            <label>Pilih Bank Tujuan</label>
            <select
              className="form-input"
              value={form.bank_name}
              onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
            >
              <option value="bca">BCA</option>
              <option value="bni">BNI</option>
              <option value="bri">BRI</option>
              <option value="mandiri">Mandiri</option>
            </select>
          </div>
        )}
        <button
          type="submit"
          className="btn btn-yellow btn-lg btn-full"
          disabled={submitting}
        >
          {submitting ? "Memproses..." : "Bayar Sekarang"}
        </button>
      </form>
    </div>
  );
}
