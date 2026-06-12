import React, { useState, useEffect } from "react";
import api from "../../utils/api";

const fmt = (p) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(p);
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const STATUS = {
  pending: { label: "Menunggu", cls: "badge-pending" },
  confirmed: { label: "Dikonfirmasi", cls: "badge-available" },
  shipped: { label: "Dikirim", cls: "badge" },
  completed: { label: "Selesai", cls: "badge-paid" },
  cancelled: { label: "Dibatalkan", cls: "badge" },
};

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api
      .get("/payments/seller-orders")
      .then((r) => setOrders(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const totalRevenue = orders
    .filter((o) => o.status === "completed")
    .reduce((s, o) => s + parseFloat(o.amount), 0);

  if (loading) return <div className="loading-screen">Memuat pesanan...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Pesanan Masuk</h1>
        <p>
          Total pendapatan: <strong>{fmt(totalRevenue)}</strong>
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 20,
          background: "var(--white)",
          border: "1.5px solid var(--gray-200)",
          borderRadius: "var(--radius)",
          padding: 6,
          width: "fit-content",
        }}
      >
        {[
          ["all", "Semua"],
          ["pending", "Menunggu"],
          ["confirmed", "Dikonfirmasi"],
          ["shipped", "Dikirim"],
          ["completed", "Selesai"],
          ["cancelled", "Dibatalkan"],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className="btn btn-sm"
            style={{
              background: filter === v ? "var(--black)" : "transparent",
              color: filter === v ? "var(--white)" : "var(--gray-600)",
              border: "none",
              borderRadius: "var(--radius-sm)",
            }}
          >
            {l}{" "}
            <span style={{ fontSize: 11, opacity: 0.7 }}>
              (
              {v === "all"
                ? orders.length
                : orders.filter((o) => o.status === v).length}
              )
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>Tidak ada pesanan</h3>
          <p>Belum ada pesanan dengan status ini</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Produk</th>
                <th>Pembeli</th>
                <th>Total</th>
                <th>Tanggal</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const s = STATUS[o.status] || STATUS.pending;
                return (
                  <tr key={o._id || o.id}>
                    <td style={{ fontWeight: 500, maxWidth: 200 }}>
                      {o.product_name}
                    </td>
                    <td>
                      <div style={{ fontSize: 14 }}>{o.buyer_name}</div>
                      <div style={{ fontSize: 12, color: "var(--gray-400)" }}>
                        {o.buyer_email}
                      </div>
                    </td>
                    <td
                      style={{
                        fontWeight: 700,
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      {fmt(o.amount)}
                    </td>
                    <td style={{ fontSize: 13, color: "var(--gray-400)" }}>
                      {fmtDate(o.createdAt)}
                    </td>
                    <td>
                      <span className={`badge ${s.cls}`}>{s.label}</span>
                    </td>
                    <td>
                      {o.status === "pending" ? (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={async () => {
                              try {
                                await api.post(
                                  `/payments/confirm/${o._id || o.id}`,
                                  { accept: true },
                                );
                                const r = await api.get(
                                  "/payments/seller-orders",
                                );
                                setOrders(r.data);
                              } catch (err) {
                                console.error(err);
                                alert(
                                  err.response?.data?.message ||
                                    "Gagal konfirmasi",
                                );
                              }
                            }}
                          >
                            Terima
                          </button>
                          <button
                            className="btn btn-sm danger"
                            onClick={async () => {
                              if (!confirm("Tolak pesanan ini?")) return;
                              try {
                                await api.post(
                                  `/payments/confirm/${o._id || o.id}`,
                                  { accept: false, reason: "Ditolak penjual" },
                                );
                                const r = await api.get(
                                  "/payments/seller-orders",
                                );
                                setOrders(r.data);
                              } catch (err) {
                                console.error(err);
                                alert(
                                  err.response?.data?.message ||
                                    "Gagal menolak",
                                );
                              }
                            }}
                          >
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <span
                          style={{ color: "var(--gray-500)", fontSize: 13 }}
                        >
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
