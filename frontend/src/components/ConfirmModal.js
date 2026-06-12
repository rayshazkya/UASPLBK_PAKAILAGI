import React from 'react';

export default function ConfirmModal({ open, title, desc, confirmLabel = 'Ya, Lanjutkan', confirmClass = 'btn btn-primary', onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
          <div className="confirm-title">{title}</div>
          {desc && <p className="confirm-desc" style={{ marginTop: 8 }}>{desc}</p>}
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center', gap: 12 }}>
          <button className="btn btn-outline" onClick={onCancel} disabled={loading}>Batal</button>
          <button className={confirmClass} onClick={onConfirm} disabled={loading}>
            {loading ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
