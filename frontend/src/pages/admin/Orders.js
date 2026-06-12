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
  paid: { label: "Lunas", cls: "badge-paid" },
  failed: { label: "Gagal", cls: "badge-failed" },
  cancelled: { label: "Batal", cls: "badge" },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api
      .get("/admin/orders")
      .then((r) => setOrders(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const revenue = orders
    .filter((o) => o.status === "paid")
    .reduce((s, o) => s + parseFloat(o.amount), 0);

  if (loading) return <div className="loading-screen">Memuat pesanan...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Semua Pesanan</h1>
        <p>
          Total pendapatan platform: <strong>{fmt(revenue)}</strong>
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
          ["paid", "Lunas"],
          ["failed", "Gagal"],
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

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Produk</th>
              <th>Pembeli</th>
              <th>Penjual</th>
              <th>Total</th>
              <th>Tanggal</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const s = STATUS[o.status] || STATUS.pending;
              return (
                <tr key={o._id || o.id}>
                  <td
                    style={{
                      fontSize: 11,
                      fontFamily: "monospace",
                      color: "var(--gray-400)",
                    }}
                  >
                    {(o.midtrans_order_id || o._id || "").slice(-12)}
                  </td>
                  <td style={{ fontWeight: 500, maxWidth: 160, fontSize: 13 }}>
                    {o.product_name}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    <div>{o.buyer_name}</div>
                    <div style={{ fontSize: 11, color: "var(--gray-400)" }}>
                      {o.buyer_email}
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{o.seller_name || "-"}</td>
                  <td
                    style={{
                      fontWeight: 700,
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {fmt(o.amount)}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--gray-400)" }}>
                    {fmtDate(o.createdAt)}
                  </td>
                  <td>
                    <span className={`badge ${s.cls}`}>{s.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div
            style={{
              padding: "32px",
              textAlign: "center",
              color: "var(--gray-400)",
              fontSize: 13,
            }}
          >
            Tidak ada pesanan
          </div>
        )}
      </div>
    </div>
  );
}
