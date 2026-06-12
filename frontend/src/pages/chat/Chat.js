import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './Chat.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const CHAT_URL = process.env.REACT_APP_CHAT_URL || 'http://localhost:3003';

export default function Chat() {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [activeRoom, setActiveRoom] = useState(null);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('fr_token');
    socketRef.current = io(CHAT_URL, { auth: { token } });
    socketRef.current.on('new_message', (msg) => {
      setMessages(prev => prev.find(m => (m._id || m.id) === (msg._id || msg.id)) ? prev : [...prev, msg]);
      fetchRooms();
    });
    return () => socketRef.current?.disconnect();
  }, []);

  const fetchRooms = () => {
    api.get('/chats/rooms').then(r => setRooms(r.data)).catch(() => {});
  };

  useEffect(() => { fetchRooms(); }, []);

  useEffect(() => {
    if (partnerId) {
      api.get(`/chats/${partnerId}`).then(r => setMessages(r.data)).catch(() => showToast('Gagal memuat pesan', 'error'));
      const room = rooms.find(r => String(r.partner_id) === String(partnerId));
      if (room) setActiveRoom(room);
    }
  }, [partnerId, rooms.length]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !partnerId) return;
    const text = input.trim();
    setInput('');
    try {
      await api.post('/chats', {
        receiver_id: partnerId,
        receiver_name: activeRoom?.partner_name || '',
        message: text
      });
    } catch { showToast('Gagal mengirim', 'error'); setInput(text); }
  };

  const fmtTime = (ts) => new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (ts) => { const d = new Date(ts); const t = new Date(); return d.toDateString() === t.toDateString() ? 'Hari ini' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }); };

  return (
    <div className="chat-wrap">
      <div className="chat-sidebar">
        <div className="chat-sidebar-hdr">
          <h2>Pesan</h2>
        </div>
        <div className="rooms-list">
          {rooms.length === 0 && <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 14 }}>Belum ada percakapan</div>}
          {rooms.map(room => (
            <button key={room.partner_id} className={`room-item ${String(room.partner_id) === String(partnerId) ? 'active' : ''}`} onClick={() => { setActiveRoom(room); navigate(`/chat/${room.partner_id}`); }}>
              <div className="avatar avatar-md">{room.partner_name?.[0]?.toUpperCase()}</div>
              <div className="room-info">
                <div className="room-top">
                  <span className="room-name">{room.partner_name}</span>
                  <span className="room-time">{room.last_time ? fmtTime(room.last_time) : ''}</span>
                </div>
                {room.product_name && <div className="room-product">re: {room.product_name}</div>}
                <div className="room-last">{room.last_message}</div>
              </div>
              {room.unread_count > 0 && <span className="unread-dot">{room.unread_count}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="chat-main">
        {!partnerId ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)', gap: 12 }}>
            <div style={{ fontSize: 48, opacity: 0.3 }}>💬</div>
            <div style={{ fontWeight: 600, color: 'var(--gray-600)' }}>Pilih percakapan</div>
            <div style={{ fontSize: 13 }}>Atau tanya penjual dari halaman produk</div>
          </div>
        ) : (
          <>
            <div className="chat-hdr">
              {activeRoom && (
                <>
                  <div className="avatar avatar-md">{activeRoom.partner_name?.[0]?.toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{activeRoom.partner_name}</div>
                    {activeRoom.product_name && <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>re: {activeRoom.product_name}</div>}
                  </div>
                </>
              )}
            </div>

            <div className="msgs-area">
              {messages.map((msg, i) => {
                const isMe = String(msg.sender_id) === String(user?.id);
                const prev = messages[i - 1];
                const showDate = !prev || fmtDate(msg.createdAt) !== fmtDate(prev.createdAt);
                return (
                  <React.Fragment key={msg._id || msg.id || i}>
                    {showDate && <div className="date-sep">{fmtDate(msg.createdAt)}</div>}
                    {msg.product_name && i === 0 && (
                      <div className="product-ref">
                        <div className="product-ref-inner">
                          {msg.product_image && <img src={msg.product_image.startsWith('http') ? msg.product_image : `${API}${msg.product_image}`} alt="" />}
                          <span>{msg.product_name}</span>
                        </div>
                      </div>
                    )}
                    <div className={`msg ${isMe ? 'me' : 'them'}`}>
                      <div className="bubble">{msg.message}</div>
                      <div className="msg-time">{fmtTime(msg.createdAt)}</div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form className="chat-input-row" onSubmit={sendMessage}>
              <input className="chat-input" value={input} onChange={e => setInput(e.target.value)} placeholder="Ketik pesan..." autoComplete="off" />
              <button type="submit" className="send-btn" disabled={!input.trim()}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 8L2 2l3 6-3 6 12-6z" fill="currentColor"/></svg>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
