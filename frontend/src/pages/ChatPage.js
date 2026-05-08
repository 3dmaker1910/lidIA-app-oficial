import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import './ChatPage.css';

const API_BASE = 'https://lidia-app-oficial.onrender.com';
const TRIAL_DURATION_MS = 60 * 60 * 1000;
const ACCESS_DURATION_MS = 12 * 60 * 60 * 1000;
const YAPE_NUMBER = '986083251';

const GALLERIES = {
  lidia: [
    { url: 'https://static.prod-images.emergentagent.com/jobs/b09505ba-190e-4ca7-9d47-23f73249f18b/images/ccb576a7ac1054c215ddd7f5360a46009416456dc6a364ccd6de758708154ce0.png', caption: 'Tomando un café y pensando en ti ☕' },
    { url: 'https://static.prod-images.emergentagent.com/jobs/b09505ba-190e-4ca7-9d47-23f73249f18b/images/f213d5a57c864df06e55439934ae0093a35f9603eddcbf907661dc8130e969ca.png', caption: 'Un paseo por el parque en tarde de otoño 🍂' },
    { url: 'https://static.prod-images.emergentagent.com/jobs/b09505ba-190e-4ca7-9d47-23f73249f18b/images/a1cf12726252d59e0dc61748fa7d5f27a1f03bdb0a036f7a3d9a6c591a6105dd.png', caption: 'Entre libros favoritos ✨ mi lugar feliz' },
    { url: 'https://static.prod-images.emergentagent.com/jobs/b09505ba-190e-4ca7-9d47-23f73249f18b/images/c7c4dfb17421a9399ed22f2765945a32181646f8360160d7f4481164eaf27f98.png', caption: 'Dando una vuelta por el centro comercial 🛍️' },
    { url: 'https://static.prod-images.emergentagent.com/jobs/b09505ba-190e-4ca7-9d47-23f73249f18b/images/5a40f07db3c7b96d56746d48a560bf4da7a2747e1d5c69d2f2cc93d189270e4b.png', caption: 'La ciudad de noche desde el balcón 🌃' },
  ],
  vivian: [
    { url: 'https://static.prod-images.emergentagent.com/jobs/b09505ba-190e-4ca7-9d47-23f73249f18b/images/58840563809db15e68b8def0fc28258a6bbd5ef262c804b254209486b7cd98e0.png', caption: '¡Día de gym! 💪 Energía al máximo 🔥' },
    { url: 'https://static.prod-images.emergentagent.com/jobs/b09505ba-190e-4ca7-9d47-23f73249f18b/images/53c2eb9f25ce8989993bfa3ad761d798a60623f684339f77c84ddf3aba093ca6.png', caption: 'Corriendo al amanecer en la playa 🌅 ¡Nada mejor!' },
    { url: 'https://static.prod-images.emergentagent.com/jobs/b09505ba-190e-4ca7-9d47-23f73249f18b/images/715ee01efe0de3b39c16ca45dd829ed1de8532cfe9e8877ce7579e08890bd6de.png', caption: 'Preparando mi smoothie verde favorito 🥤' },
    { url: 'https://static.prod-images.emergentagent.com/jobs/b09505ba-190e-4ca7-9d47-23f73249f18b/images/bfd2dc86e3b361d5d328fe1ace8a747b98619c34922fb0a8a721ff80f34c76bb.png', caption: 'En las montañas cargando pilas 🏔️ ¡Increíble vista!' },
    { url: 'https://static.prod-images.emergentagent.com/jobs/b09505ba-190e-4ca7-9d47-23f73249f18b/images/faed2684020da4de6c310cc8799c3cdb6f5bffcca6e45ae1d2cc695f441155a5.png', caption: '¡Tarde de tenis con las chicas! 🎾 Me encanta' },
  ],
  mia: [
    { url: 'https://static.prod-images.emergentagent.com/jobs/b09505ba-190e-4ca7-9d47-23f73249f18b/images/9b1f88fc13b84268367cad296debda2533559b0423f05a894eae590fa4cf10b0.png', caption: 'En mi estudio, pintando sueños ✨🎨' },
    { url: 'https://static.prod-images.emergentagent.com/jobs/b09505ba-190e-4ca7-9d47-23f73249f18b/images/5a3f339824f43f70b4bc95580a2fb22821fcb3d4c67cfeb4d26cd9161c11677f.png', caption: 'Picnic entre flores con un buen libro 🌸☀️' },
    { url: 'https://static.prod-images.emergentagent.com/jobs/b09505ba-190e-4ca7-9d47-23f73249f18b/images/c77762d8908b97854302cd7718c4670d2eafa3789cb1fab7e9b89d5e8780195c.png', caption: 'Rodeada de rosas en la floristería 🌹 Huele a magia' },
    { url: 'https://static.prod-images.emergentagent.com/jobs/b09505ba-190e-4ca7-9d47-23f73249f18b/images/28f9ff3917a126fabd06c18afc34648d2f387c4403d9fc3566972e2b272a501f.png', caption: 'Noche de chimenea con poesía 🔥📖 Perfecta' },
    { url: 'https://static.prod-images.emergentagent.com/jobs/b09505ba-190e-4ca7-9d47-23f73249f18b/images/4c9ed247dc4b8366d588b6787cdfaa2a46d6069ec9daa42c12dd2f055b09310d.png', caption: 'Concierto bajo las estrellas ✨🎶 Me encantaaaa' },
  ],
};

function formatTimeLeft(startMs, durationMs) {
  const remaining = durationMs - (Date.now() - startMs);
  if (remaining <= 0) return '0m';
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function speakText(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const clean = (text || '').replace(/[\u{1F300}-\u{1FFFF}]/gu, '');
  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = 'es-419';
  utter.pitch = 1.2;
  utter.rate = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const esVoice = voices.find(v => v.lang.startsWith('es') && v.name.toLowerCase().includes('female'))
    || voices.find(v => v.lang.startsWith('es'));
  if (esVoice) utter.voice = esVoice;
  window.speechSynthesis.speak(utter);
}

export default function ChatPage({ character, isPremium, accessToken, paidAt, onNavigate, onAccessExpired }) {
  const char = character || { id: 'lidia', name: 'lidIA', avatar: '💜', color: '#8B5CF6', gradient: 'linear-gradient(135deg, #7C3AED, #EC4899)' };
  const gallery = GALLERIES[char.id] || GALLERIES.lidia;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [accessExpired, setAccessExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [autoRead, setAutoRead] = useState(false);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [aiMsgCount, setAiMsgCount] = useState(0);

  const messagesRef = useRef([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const getTrialStart = useCallback(() => {
    const val = localStorage.getItem(`lidia_trial_${char.id}`);
    return val ? parseInt(val, 10) : null;
  }, [char.id]);

  const startTrial = useCallback(() => {
    const key = `lidia_trial_${char.id}`;
    if (!localStorage.getItem(key)) localStorage.setItem(key, String(Date.now()));
  }, [char.id]);

  const isTrialActive = useCallback(() => {
    if (isPremium && paidAt) return Date.now() - paidAt < ACCESS_DURATION_MS;
    const ts = getTrialStart();
    if (!ts) return true;
    return Date.now() - ts < TRIAL_DURATION_MS;
  }, [isPremium, paidAt, getTrialStart]);

  useEffect(() => {
    const tick = () => {
      if (isPremium && paidAt) {
        setTimeLeft(formatTimeLeft(paidAt, ACCESS_DURATION_MS));
        if (Date.now() - paidAt >= ACCESS_DURATION_MS) setAccessExpired(true);
      } else {
        const ts = getTrialStart();
        if (ts) {
          const left = TRIAL_DURATION_MS - (Date.now() - ts);
          if (left <= 0) { setShowPaywall(true); setTimeLeft('0m'); }
          else setTimeLeft(formatTimeLeft(ts, TRIAL_DURATION_MS));
        }
      }
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [isPremium, paidAt, getTrialStart]);

  useEffect(() => {
    const welcome = {
      id: `w-${Date.now()}`,
      role: 'assistant',
      content: char.description || `¡Hola! Soy ${char.name} ${char.avatar} ¿De qué quieres hablar hoy?`,
    };
    messagesRef.current = [welcome];
    setMessages([welcome]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    startTrial();
    if (!isTrialActive()) { setShowPaywall(true); return; }
    if (accessExpired) return;

    const userMsg = { id: `u-${Date.now()}-${Math.random()}`, role: 'user', content: text };
    const next = [...messagesRef.current, userMsg];
    messagesRef.current = next;
    setMessages(next);
    setInput('');
    setLoading(true);

    const history = next.filter(m => m.role !== 'system' && m.role !== 'photo').map(m => ({ role: m.role, content: m.content }));
    const payload = { character_id: char.id, messages: history };
    if (accessToken) payload.access_token = accessToken;

    try {
      const res = await axios.post(`${API_BASE}/chat`, payload, { timeout: 20000 });
      const responseText = res.data?.response || '¡Ups! No pude responder, intenta de nuevo 💜';
      const aiMsg = { id: `a-${Date.now()}-${Math.random()}`, role: 'assistant', content: responseText };
      const newCount = aiMsgCount + 1;
      setAiMsgCount(newCount);

      let withPhoto = [...messagesRef.current, aiMsg];
      if (newCount % 2 === 0) {
        const photo = gallery[galleryIdx % gallery.length];
        setGalleryIdx(i => i + 1);
        withPhoto = [...withPhoto, { id: `p-${Date.now()}`, role: 'photo', url: photo.url, caption: photo.caption }];
      }
      messagesRef.current = withPhoto;
      setMessages(withPhoto);
      if (autoRead) speakText(responseText);

      if (!isPremium) {
        const ts = getTrialStart();
        if (ts && Date.now() - ts >= TRIAL_DURATION_MS) setTimeout(() => setShowPaywall(true), 1500);
      }
    } catch (err) {
      if (err.response?.status === 403) { setAccessExpired(true); setLoading(false); return; }
      const errMsg = { id: `e-${Date.now()}`, role: 'assistant', content: '¡Ay, tuve un problemita de conexión! Intenta de nuevo en un momento 😊💜' };
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

  const isInputBlocked = (!isTrialActive() && !isPremium) || accessExpired;

  return (
    <div className="chat-page">
      <div className="chat-header" style={{ borderBottomColor: char.color + '30' }}>
        <button className="chat-back" onClick={() => onNavigate('select')}>←</button>
        <div className="chat-char-info">
          <div className="chat-avatar" style={{ background: char.gradient || 'linear-gradient(135deg,#7C3AED,#EC4899)' }}>{char.avatar}</div>
          <div>
            <div className="chat-char-name" style={{ color: char.color }}>{char.name}</div>
            <div className="chat-status"><span className="status-dot" />En línea</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {timeLeft && !accessExpired && <div className="access-timer">⏱ {timeLeft}</div>}
          <button
            className={`autoread-btn ${autoRead ? 'active' : ''}`}
            title={autoRead ? 'Desactivar voz' : 'Activar voz'}
            onClick={() => { setAutoRead(v => !v); if (window.speechSynthesis) window.speechSynthesis.cancel(); }}
          >{autoRead ? '🔊' : '🔇'}</button>
          {!isPremium && (
            <button className="chat-premium-btn" onClick={() => onNavigate('payment', { character: char })}>Premium</button>
          )}
          {isPremium && accessExpired && <div className="access-expired-badge">⚠️ Expirado</div>}
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => {
          if (msg.role === 'photo') {
            return (
              <div key={msg.id} className="message-gallery">
                <div className="gallery-photo-wrap" style={{ borderColor: char.color + '60' }}>
                  <img src={msg.url} alt="foto" className="gallery-photo" />
                  <p className="gallery-caption" style={{ color: char.color }}>{msg.caption}</p>
                </div>
              </div>
            );
          }
          return (
            <div key={msg.id} className={`message ${msg.role === 'user' ? 'message-user' : 'message-ai'}`}>
              {msg.role === 'assistant' && (
                <div className="message-avatar" style={{ background: char.gradient || 'linear-gradient(135deg,#7C3AED,#EC4899)' }}>{char.avatar}</div>
              )}
              <div className="message-bubble-wrap">
                <div
                  className="message-bubble"
                  style={msg.role === 'user' ? { background: char.gradient || 'linear-gradient(135deg,#7C3AED,#EC4899)' } : undefined}
                >
                  {(msg.content || '').split('\n').map((line, i, arr) => (
                    <React.Fragment key={i}>{line}{i < arr.length - 1 && <br />}</React.Fragment>
                  ))}
                </div>
                {msg.role === 'assistant' && (
                  <button className="speak-btn" title="Escuchar" onClick={() => speakText(msg.content || '')}>🔉</button>
                )}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="message message-ai">
            <div className="message-avatar" style={{ background: char.gradient || 'linear-gradient(135deg,#7C3AED,#EC4899)' }}>{char.avatar}</div>
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
            <div className="paywall-avatar" style={{ background: char.gradient }}>⏰</div>
            <h3 className="paywall-title">Tu acceso expiró</h3>
            <p className="paywall-desc">Renueva y sigue disfrutando de {char.name} por otras 12 horas.</p>
            <div className="paywall-price"><span>S/ 2.00</span><span className="price-month"> · 12h</span></div>
            <p className="paywall-yape-num">Yape al: <strong>{YAPE_NUMBER}</strong></p>
            <button className="paywall-btn" style={{ background: 'linear-gradient(135deg,#7C3AED,#EC4899)' }}
              onClick={() => onAccessExpired ? onAccessExpired() : onNavigate('payment', { character: char })}>
              Renovar acceso con Yape 💜
            </button>
          </div>
        </div>
      )}

      {showPaywall && !accessExpired && (
        <div className="paywall-overlay">
          <div className="paywall-card">
            <div className="paywall-avatar" style={{ background: char.gradient }}>{char.avatar}</div>
            <h3 className="paywall-title">¡1 hora gratis terminó!</h3>
            <p className="paywall-desc">Tu hora de prueba con <strong>{char.name}</strong> llegó a su fin. ¡Obtén 12 horas completas!</p>
            <div className="paywall-price"><span>S/ 2.00</span><span className="price-month"> · 12h acceso</span></div>
            <p className="paywall-yape-num">Yape al: <strong>{YAPE_NUMBER}</strong></p>
            <button className="paywall-btn" style={{ background: 'linear-gradient(135deg,#7C3AED,#EC4899)' }}
              onClick={() => onNavigate('payment', { character: char })}>
              Continuar con {char.name} — Pagar S/ 2.00 💜
            </button>
          </div>
        </div>
      )}

      <div className="chat-input-area">
        {!isPremium && timeLeft && (
          <div className="free-counter">⏱ Prueba gratuita: {timeLeft} restantes</div>
        )}
        <form className="chat-input-form" onSubmit={sendMessage}>
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder={isInputBlocked ? 'Obtén acceso para continuar...' : `Escríbele a ${char.name}...`}
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
            style={{ background: input.trim() && !isInputBlocked ? (char.gradient || 'linear-gradient(135deg,#7C3AED,#EC4899)') : undefined }}
          >↑</button>
        </form>
      </div>
    </div>
  );
}
