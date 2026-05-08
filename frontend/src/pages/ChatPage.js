import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import './ChatPage.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://lidia-app-oficial.onrender.com';
const FREE_MESSAGE_LIMIT = 3;
const ACCESS_DURATION_MS = 12 * 60 * 60 * 1000;

const YAPE_NUMBER = '986083251';

function makeId() {
  return Date.now() + Math.random();
}

function formatTimeLeft(paidAt) {
  if (!paidAt) return null;
  const elapsed = Date.now() - paidAt;
  const remaining = ACCESS_DURATION_MS - elapsed;
  if (remaining <= 0) return '0h 0m';
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

export default function ChatPage({ character, isPremium, accessToken, paidAt, accessExpiresAt, onNavigate, onAccessExpired }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [accessExpired, setAccessExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesRef = useRef([]);

  const char = character || {
    id: 'lidia',
    name: 'lidIA',
    avatar: '💜',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #7C3AED, #EC4899)',
  };

  const checkAccess = useCallback(() => {
    if (!isPremium || !paidAt) return true;
    return Date.now() - paidAt < ACCESS_DURATION_MS;
  }, [isPremium, paidAt]);

  useEffect(() => {
    if (!isPremium || !paidAt) return;
    setTimeLeft(formatTimeLeft(paidAt));
    const timer = setInterval(() => {
      setTimeLeft(formatTimeLeft(paidAt));
      if (!checkAccess()) {
        setAccessExpired(true);
        clearInterval(timer);
      }
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, [isPremium, paidAt, checkAccess]);

  useEffect(() => {
    const welcome = {
      id: makeId(),
      role: 'assistant',
      content: `¡Hola! Soy ${char.name} ${char.avatar || ''}\n\n${char.description || 'Estoy aquí para ayudarte. ¿De qué quieres hablar hoy?'}${!isPremium ? `\n\n💜 Tienes ${FREE_MESSAGE_LIMIT} mensajes gratuitos. ¡Aprovéchalos!` : `\n\n✨ Tienes ${ACCESS_DURATION_MS / 3600000}h de acceso premium.`}`,
    };
    const initial = [welcome];
    messagesRef.current = initial;
    setMessages(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    if (isPremium && !checkAccess()) {
      setAccessExpired(true);
      return;
    }

    if (!isPremium && msgCount >= FREE_MESSAGE_LIMIT) {
      setShowPaywall(true);
      return;
    }

    const userMsg = { id: makeId(), role: 'user', content: text };
    const updatedMessages = [...messagesRef.current, userMsg];
    messagesRef.current = updatedMessages;
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    const conversationHistory = updatedMessages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    const payload = { character_id: char.id, messages: conversationHistory };
    if (accessToken) payload.access_token = accessToken;

    try {
      const res = await axios.post(`${API_BASE}/chat`, payload);
      const aiMsg = {
        id: makeId(),
        role: 'assistant',
        content: (res.data && res.data.response) ? res.data.response : 'No pude obtener respuesta. Intenta nuevamente. 💜',
      };
      const withAi = [...messagesRef.current, aiMsg];
      messagesRef.current = withAi;
      setMessages(withAi);
      setMsgCount(c => {
        const next = c + 1;
        if (!isPremium && next >= FREE_MESSAGE_LIMIT) {
          setTimeout(() => setShowPaywall(true), 1500);
        }
        return next;
      });
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.detail?.code === 'ACCESS_EXPIRED') {
        setAccessExpired(true);
        setLoading(false);
        inputRef.current?.focus();
        return;
      }
      const errMsg = {
        id: makeId(),
        role: 'assistant',
        content: 'Lo siento, tuve un problema conectándome. Por favor intenta nuevamente. 💜',
      };
      const withErr = [...messagesRef.current, errMsg];
      messagesRef.current = withErr;
      setMessages(withErr);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isInputBlocked = (!isPremium && msgCount >= FREE_MESSAGE_LIMIT) || (isPremium && accessExpired);

  return (
    <div className="chat-page">
      <div className="chat-header" style={{ borderBottomColor: char.color + '30' }}>
        <button className="chat-back" onClick={() => onNavigate('select')}>←</button>
        <div className="chat-char-info">
          <div className="chat-avatar" style={{ background: char.gradient || 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>{char.avatar}</div>
          <div>
            <div className="chat-char-name" style={{ color: char.color }}>{char.name}</div>
            <div className="chat-status">
              <span className="status-dot" />
              En línea
            </div>
          </div>
        </div>
        {!isPremium && (
          <button className="chat-premium-btn" onClick={() => onNavigate('payment', { character: char })}>
            Premium
          </button>
        )}
        {isPremium && !accessExpired && timeLeft && (
          <div className="access-timer" title="Tiempo restante de acceso">
            ⏱ {timeLeft}
          </div>
        )}
        {isPremium && accessExpired && (
          <div className="access-expired-badge">⚠️ Expirado</div>
        )}
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role === 'user' ? 'message-user' : 'message-ai'}`}>
            {msg.role === 'assistant' && (
              <div className="message-avatar" style={{ background: char.gradient || 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
                {char.avatar}
              </div>
            )}
            <div
              className="message-bubble"
              style={msg.role === 'user' ? { background: char.gradient || 'linear-gradient(135deg, #7C3AED, #EC4899)' } : undefined}
            >
              {(msg.content || '').split('\n').map((line, i, arr) => (
                <React.Fragment key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message message-ai">
            <div className="message-avatar" style={{ background: char.gradient || 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
              {char.avatar}
            </div>
            <div className="message-bubble message-typing">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {accessExpired && (
        <div className="paywall-overlay">
          <div className="paywall-card">
            <div className="paywall-avatar" style={{ background: char.gradient || 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
              ⏰
            </div>
            <h3 className="paywall-title">Acceso expirado</h3>
            <p className="paywall-desc">
              Tus <strong>12 horas</strong> de acceso han terminado. Realiza un nuevo pago para continuar chateando con {char.name}.
            </p>
            <div className="paywall-price">
              <span>S/ 2.00</span>
              <span className="price-month"> · 12h acceso</span>
            </div>
            <p className="paywall-yape-num">Yape al: <strong>{YAPE_NUMBER}</strong></p>
            <button
              className="paywall-btn"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
              onClick={() => onAccessExpired ? onAccessExpired() : onNavigate('payment', { character: char })}
            >
              Renovar acceso — Pagar con Yape {YAPE_NUMBER}
            </button>
          </div>
        </div>
      )}

      {showPaywall && !accessExpired && (
        <div className="paywall-overlay">
          <div className="paywall-card">
            <div className="paywall-avatar" style={{ background: char.gradient || 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
              {char.avatar}
            </div>
            <h3 className="paywall-title">Continúa con {char.name} 💜</h3>
            <p className="paywall-desc">
              Has usado tus {FREE_MESSAGE_LIMIT} mensajes gratuitos. Obtén acceso premium por 12 horas.
            </p>
            <div className="paywall-price">
              <span>S/ 2.00</span>
              <span className="price-month"> · 12h acceso</span>
            </div>
            <p className="paywall-yape-num">Yape al: <strong>{YAPE_NUMBER}</strong></p>
            <button
              className="paywall-btn"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
              onClick={() => onNavigate('payment', { character: char })}
            >
              Obtener acceso → Pagar con Yape {YAPE_NUMBER}
            </button>
            <button className="paywall-dismiss" onClick={() => setShowPaywall(false)}>
              Continuar con límite
            </button>
          </div>
        </div>
      )}

      <div className="chat-input-area">
        {!isPremium && msgCount < FREE_MESSAGE_LIMIT && (
          <div className="free-counter">
            {FREE_MESSAGE_LIMIT - msgCount} mensajes gratuitos restantes
          </div>
        )}
        <form className="chat-input-form" onSubmit={sendMessage}>
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder={isInputBlocked ? 'Obtén acceso para continuar...' : `Escribe a ${char.name}...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading || isInputBlocked}
          />
          <button
            type="submit"
            className="send-btn"
            disabled={!input.trim() || loading || isInputBlocked}
            style={{ background: input.trim() && !isInputBlocked ? (char.gradient || 'linear-gradient(135deg, #7C3AED, #EC4899)') : undefined }}
          >
            ↑
          </button>
        </form>
      </div>
    </div>
  );
}
