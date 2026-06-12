import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../../components/ConfirmModal";

export default function OpenStore() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: "",
    description: "",
    street: "",
    city: "",
    province: "",
    postal_code: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  if (user?.has_store) {
    navigate("/seller");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return showToast("Nama toko wajib diisi", "error");
    if (!form.street.trim())
      return showToast("Alamat jalan wajib diisi", "error");
    if (!form.city.trim())
      return showToast("Kota / Kabupaten wajib diisi", "error");
    if (!form.province.trim())
      return showToast("Provinsi wajib diisi", "error");
    setConfirm(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const completeAddress = `${form.street}, ${form.city}, ${form.province}${form.postal_code ? `, ${form.postal_code}` : ""}`;
      await api.post("/stores", { ...form, address: completeAddress });
      await refreshUser();
      showToast("Toko berhasil dibuka!", "success");
      navigate("/seller");
    } catch (err) {
      showToast(err.response?.data?.message || "Gagal membuka toko", "error");
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="page-header">
        <h1>Buka Toko</h1>
        <p>Mulai jual pakaian pre-loved kamu sekarang</p>
      </div>

      <div className="card card-pad">
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            padding: "16px",
            background: "var(--yellow-light)",
            borderRadius: "var(--radius)",
            marginBottom: 24,
            border: "1px solid #f0d060",
          }}
        >
          <div style={{ fontSize: 28 }}>🏪</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
              Toko langsung aktif!
            </div>
            <div style={{ fontSize: 13, color: "var(--gray-600)" }}>
              Setelah mendaftar, kamu langsung bisa upload produk dan mulai
              berjualan.
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div className="form-group">
            <label>
              Nama Toko <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input
              className="form-input"
              placeholder="Contoh: Thrift By Kiya"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Deskripsi Toko</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Ceritakan tentang tokomu..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>
              Alamat Jalan <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input
              className="form-input"
              placeholder="Jalan, nomor rumah/gedung"
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>
              Kota / Kabupaten <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input
              className="form-input"
              placeholder="Contoh: Bandung"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>
              Provinsi <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input
              className="form-input"
              placeholder="Contoh: Jawa Barat"
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Kode Pos</label>
            <input
              className="form-input"
              placeholder="Contoh: 40123"
              value={form.postal_code}
              onChange={(e) =>
                setForm({ ...form, postal_code: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>Nomor HP / WhatsApp</label>
            <input
              className="form-input"
              placeholder="08xxxxxxxxxx"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <button
            type="submit"
            className="btn btn-yellow btn-lg btn-full"
            disabled={loading}
          >
            Buka Toko Sekarang
          </button>
        </form>
      </div>

      <ConfirmModal
        open={confirm}
        title={`Buka toko "${form.name}"?`}
        desc="Tokomu akan langsung aktif dan bisa menerima pembeli."
        confirmLabel="Ya, Buka Toko"
        confirmClass="btn btn-yellow"
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(false)}
        loading={loading}
      />
    </div>
  );
}
