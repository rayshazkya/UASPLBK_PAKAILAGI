import React, { useState, useEffect } from "react";
import api from "../../utils/api";

const API = process.env.REACT_APP_API_URL || "http://localhost:8080";
const fmt = (p) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(p);
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const STATUS = {
  pending: { label: "Menunggu", cls: "badge-pending" },
  confirmed: { label: "Dikonfirmasi", cls: "badge-available" },
  shipped: { label: "Dikirim", cls: "badge" },
  completed: { label: "Selesai", cls: "badge-paid" },
  cancelled: { label: "Dibatalkan", cls: "badge" },
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/payments/orders")
      .then((r) => setOrders(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen">Memuat pesanan...</div>;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <div className="page-header">
        <h1>Pesananku</h1>
        <p>Riwayat pembelian kamu</p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛍️</div>
          <h3>Belum ada pesanan</h3>
          <p>Yuk mulai belanja di Fashion Rescue!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orders.map((order) => {
            const s = STATUS[order.status] || STATUS.pending;
            const img = order.product_image || "";
            const imgSrc = img.startsWith("http")
              ? img
              : img
                ? `${API}${img}`
                : "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200";
            return (
              <div
                key={order._id || order.id}
                className="card"
                style={{
                  display: "flex",
                  gap: 16,
                  padding: 16,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 90,
                    borderRadius: 8,
                    overflow: "hidden",
                    background: "var(--gray-100)",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={imgSrc}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.target.src =
                        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200";
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 15 }}>
                      {order.product_name}
                    </div>
                    <span className={`badge ${s.cls}`}>{s.label}</span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--gray-400)",
                      marginBottom: 8,
                    }}
                  >
                    {order.store_name && <span>{order.store_name} · </span>}
                    {order.product_grade && (
                      <span>Grade {order.product_grade}</span>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: 17,
                      }}
                    >
                      {fmt(order.amount)}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--gray-400)" }}>
                      {fmtDate(order.createdAt)}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--gray-300)",
                      marginTop: 4,
                      fontFamily: "monospace",
                    }}
                  >
                    #{order.midtrans_order_id || order._id}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
