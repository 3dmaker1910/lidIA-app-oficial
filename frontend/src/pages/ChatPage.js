import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import './ChatPage.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://lidia-app-oficial.onrender.com';
const FREE_MESSAGE_LIMIT = 3;
const ACCESS_DURATION_MS = 12 * 60 * 60 * 1000;
const YAPE_NUMBER = '986083251';
const GALLERY_PHOTO_EVERY = 2;

const CHARACTER_GALLERIES = {
  lidia: [
    'https://static.prod-images.emergentagent.com/jobs/b09505ba-190e-4ca7-9d47-23f73249f18b/images/ccb576a7ac1054c215ddd7f5360a46009416456dc6a364ccd6de758708154ce0.png',
    'https://static.prod-images.emergentagent.com/jobs/b09505ba-190e-4ca7-9d47-23f73249f18b/images/f213d5a57c864df06e55439934ae0093a35f9603eddcbf907661dc8130e969ca.png',
  ],
  vivian: [
    'https://static.prod-images.emergentagent.com/jobs/b09505ba-190e-4ca7-9d47-23f73249f18b/images/58840563809db15e68b8def0fc28258a6bbd5ef262c804b254209486b7cd98e0.png',
    'https://static.prod-images.emergentagent.com/jobs/b09505ba-190e-4ca7-9d47-23f73249f18b/images/53c2eb9f25ce8989993bfa3ad761d798a60623f684339f77c84ddf3aba093ca6.png',
  ],
  mia: [
    'https://static.prod-images.emergentagent.com/jobs/b09505ba-190e-4ca7-9d47-23f73249f18b/images/9b1f88fc13b84268367cad296debda2533559b0423f05a894eae590fa4cf10b0.png',
    'https://static.prod-images.emergentagent.com/jobs/b09505ba-190e-4ca7-9d47-23f73249f18b/images/5a3f339824f43f70b4bc95580a2fb22821fcb3d4c67cfeb4d26cd9161c11677f.png',
  ],
};

const GALLERY_CAPTIONS = {
  lidia: ['¿Alguna vez has tomado café en un lugar así? ☕', 'Me encanta salir a caminar y pensar. ¿Y tú? ✨'],
  vivian: ['¡Esta es mi hora favorita del día! 💪🔥', '¿Correrías conmigo por la playa? 🌅'],
  mia: ['Mi rincón favorito para crear 🎨✨', 'Un día en el campo... ¿no sería perfecto? 🌸'],
};

function makeId() { return Date.now() + Math.random(); }

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
  const [aiMsgCount, setAiMsgCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [accessExpired, setAccessExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesRef = useRef([]);
  const aiMsgCountRef = useRef(0);

  const char = character || {
    id: 'lidia',
    name: 'lidIA',
    avatar: '💜',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #7C3AED, #EC4899)',
  };

  const gallery = CHARACTER_GALLERIES[char.id] || CHARACTER_GALLERIES.lidia;
  const captions = GALLERY_CAPTIONS[char.id] || GALLERY_CAPTIONS.lidia;

  const checkAccess = useCallback(() => {
    if (!isPremium || !paidAt) return true;
    return Date.now() - paidAt < ACCESS_DURATION_MS;
  }, [isPremium, paidAt]);

  useEffect(() => {
    if (!isPremium || !paidAt) return;
    setTimeLeft(formatTimeLeft(paidAt));
    const timer = setInterval(() => {
      setTimeLeft(formatTimeLeft(paidAt));
      if (!checkAccess()) { setAccessExpired(true); clearInterval(timer); }
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, [isPremium, paidAt, checkAccess]);

  useEffect(() => {
    const welcomeMessages = {
      lidia: `¡Qué gusto verte por aquí! Soy lidIA 💜\n\nEstaba esperando que alguien llegara para tener una buena conversación. ¿Cómo ha ido tu día?${!isPremium ? `\n\n✨ Tienes ${FREE_MESSAGE_LIMIT} mensajes para conocernos.` : '\n\n✨ Tienes acceso completo. Cuéntame todo lo que quieras.'}`,
      vivian: `¡Hola hola! Soy Vivian 🌸\n\n¡Me alegra muchísimo que hayas llegado! Hoy es un buen día para ese primer paso. ¿Cómo te sientes?${!isPremium ? `\n\n💪 Tienes ${FREE_MESSAGE_LIMIT} mensajes gratuitos. ¡Aprovéchalos!` : '\n\n🔥 ¡Tienes acceso premium! ¡Vamos con todo!'}`,
      mia: `Hola, qué lindo que llegaste ✨\n\nSoy Mia. Me gustan las conversaciones que dejan huella. ¿Tienes algo que quieras explorar hoy?${!isPremium ? `\n\n🌸 Tienes ${FREE_MESSAGE_LIMIT} mensajes para empezar.` : '\n\n🎨 Tienes acceso completo. ¡Cuéntame lo que sientas!'}`,
    };
    const welcome = { id: makeId(), role: 'assistant', content: welcomeMessages[char.id] || welcomeMessages.lidia };
    const initial = [welcome];
    messagesRef.current = initial;
    setMessages(initial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    if (isPremium && !checkAccess()) { setAccessExpired(true); return; }
    if (!isPremium && msgCount >= FREE_MESSAGE_LIMIT) { setShowPaywall(true); return; }

    const userMsg = { id: makeId(), role: 'user', content: text };
    const updatedMessages = [...messagesRef.current, userMsg];
    messagesRef.current = updatedMessages;
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    const conversationHistory = updatedMessages
      .filter(m => m.role !== 'system' && m.role !== 'gallery')
      .map(m => ({ role: m.role, content: m.content }));

    const payload = { character_id: char.id, messages: conversationHistory };
    if (accessToken) payload.access_token = accessToken;

    try {
      const res = await axios.post(`${API_BASE}/chat`, payload, { timeout: 20000 });
      const responseText = (res.data && res.data.response) ? res.data.response : '...';

      aiMsgCountRef.current += 1;
      const newAiCount = aiMsgCountRef.current;
      setAiMsgCount(newAiCount);

      const aiMsg = { id: makeId(), role: 'assistant', content: responseText };

      let galleryMsg = null;
      if (newAiCount % GALLERY_PHOTO_EVERY === 0) {
        const photoIdx = Math.floor((newAiCount / GALLERY_PHOTO_EVERY - 1) % gallery.length);
        galleryMsg = { id: makeId(), role: 'gallery', photoUrl: gallery[photoIdx], caption: captions[photoIdx] || '' };
      }

      const withAi = galleryMsg ? [...messagesRef.current, aiMsg, galleryMsg] : [...messagesRef.current, aiMsg];
      messagesRef.current = withAi;
      setMessages(withAi);

      setMsgCount(c => {
        const next = c + 1;
        if (!isPremium && next >= FREE_MESSAGE_LIMIT) setTimeout(() => setShowPaywall(true), 1800);
        return next;
      });
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.detail?.code === 'ACCESS_EXPIRED') {
        setAccessExpired(true); setLoading(false); inputRef.current?.focus(); return;
      }
      const fallbacks = {
        lidia: 'Ay, disculpa 💜 tuve un micro-corte. ¿Me repites lo que me ibas a decir?',
        vivian: '¡Ups! Me cortó la señal 😄 ¿Me repites? ¡Quiero escucharte!',
        mia: 'Perdona ✨ me perdí un momento. ¿Puedes contarme de nuevo?',
      };
      const errMsg = { id: makeId(), role: 'assistant', content: fallbacks[char.id] || fallbacks.lidia };
      const withErr = [...messagesRef.current, errMsg];
      messagesRef.current = withErr;
      setMessages(withErr);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
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
            <div className="chat-status"><span className="status-dot" />En línea</div>
          </div>
        </div>
        {!isPremium && (
          <button className="chat-premium-btn" onClick={() => onNavigate('payment', { character: char })}>Premium</button>
        )}
        {isPremium && !accessExpired && timeLeft && <div className="access-timer" title="Tiempo restante">⏱ {timeLeft}</div>}
        {isPremium && accessExpired && <div className="access-expired-badge">⚠️ Expirado</div>}
      </div>

      <div className="chat-messages">
        {messages.map((msg) => {
          if (msg.role === 'gallery') {
            return (
              <div key={msg.id} className="message message-gallery">
                <div className="gallery-photo-wrap" style={{ borderColor: char.color + '40' }}>
                  <img src={msg.photoUrl} alt="foto" className="gallery-photo" onError={e => { e.target.style.display = 'none'; }} />
                  {msg.caption && <p className="gallery-caption" style={{ color: char.color }}>{msg.caption}</p>}
                </div>
              </div>
            );
          }
          return (
            <div key={msg.id} className={`message ${msg.role === 'user' ? 'message-user' : 'message-ai'}`}>
              {msg.role === 'assistant' && (
                <div className="message-avatar" style={{ background: char.gradient || 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>{char.avatar}</div>
              )}
              <div className="message-bubble" style={msg.role === 'user' ? { background: char.gradient || 'linear-gradient(135deg, #7C3AED, #EC4899)' } : undefined}>
                {(msg.content || '').split('\n').map((line, i, arr) => (
                  <React.Fragment key={i}>{line}{i < arr.length - 1 && <br />}</React.Fragment>
                ))}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="message message-ai">
            <div className="message-avatar" style={{ background: char.gradient || 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>{char.avatar}</div>
            <div className="message-bubble message-typing">
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {accessExpired && (
        <div className="paywall-overlay">
          <div className="paywall-card">
            <div className="paywall-avatar" style={{ background: char.gradient || 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>⏰</div>
            <h3 className="paywall-title">Acceso expirado</h3>
            <p className="paywall-desc">Tus 12 horas terminaron. Renueva para seguir con {char.name}.</p>
            <div className="paywall-price"><span>S/ 2.00</span><span className="price-month"> · 12h acceso</span></div>
            <p className="paywall-yape-num">Yape al: <strong>{YAPE_NUMBER}</strong></p>
            <button className="paywall-btn" style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
              onClick={() => onAccessExpired ? onAccessExpired() : onNavigate('payment', { character: char })}>
              Renovar acceso — Pagar con Yape {YAPE_NUMBER}
            </button>
          </div>
        </div>
      )}

      {showPaywall && !accessExpired && (
        <div className="paywall-overlay">
          <div className="paywall-card">
            <div className="paywall-avatar" style={{ background: char.gradient || 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>{char.avatar}</div>
            <h3 className="paywall-title">Continúa con {char.name} 💜</h3>
            <p className="paywall-desc">Has usado tus {FREE_MESSAGE_LIMIT} mensajes gratuitos. Obtén 12 horas de acceso premium.</p>
            <div className="paywall-price"><span>S/ 2.00</span><span className="price-month"> · 12h acceso</span></div>
            <p className="paywall-yape-num">Yape al: <strong>{YAPE_NUMBER}</strong></p>
            <button className="paywall-btn" style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
              onClick={() => onNavigate('payment', { character: char })}>
              Obtener acceso → Pagar con Yape {YAPE_NUMBER}
            </button>
            <button className="paywall-dismiss" onClick={() => setShowPaywall(false)}>Continuar con límite</button>
          </div>
        </div>
      )}

      <div className="chat-input-area">
        {!isPremium && msgCount < FREE_MESSAGE_LIMIT && (
          <div className="free-counter">{FREE_MESSAGE_LIMIT - msgCount} mensajes gratuitos restantes</div>
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
          <button type="submit" className="send-btn"
            disabled={!input.trim() || loading || isInputBlocked}
            style={{ background: input.trim() && !isInputBlocked ? (char.gradient || 'linear-gradient(135deg, #7C3AED, #EC4899)') : undefined }}>
            ↑
          </button>
        </form>
      </div>
    </div>
  );
}
