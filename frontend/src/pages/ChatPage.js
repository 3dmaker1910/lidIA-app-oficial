import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './ChatPage.css';

const API_BASE = process.env.REACT_APP_API_URL || '';
const FREE_MESSAGE_LIMIT = 3;

export default function ChatPage({ character, isPremium, onNavigate }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const char = character || {
    id: 'lidia',
    name: 'lidIA',
    avatar: '💜',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #7C3AED, #EC4899)',
  };

  useEffect(() => {
    const welcome = {
      id: Date.now(),
      role: 'assistant',
      content: `¡Hola! Soy ${char.name} ${char.avatar}\n\n${char.description || 'Estoy aquí para ayudarte. ¿De qué quieres hablar hoy?'}${!isPremium ? `\n\n💜 Tienes ${FREE_MESSAGE_LIMIT} mensajes gratuitos. ¡Aprovéchalos!` : ''}`,
    };
    setMessages([welcome]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    if (!isPremium && msgCount >= FREE_MESSAGE_LIMIT) {
      setShowPaywall(true);
      return;
    }

    const userMsg = { id: Date.now(), role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const conversationHistory = newMessages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await axios.post(`${API_BASE}/chat`, {
        character_id: char.id,
        messages: conversationHistory,
      });
      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.data.response,
      };
      setMessages(prev => [...prev, aiMsg]);
      setMsgCount(c => c + 1);
      if (!isPremium && msgCount + 1 >= FREE_MESSAGE_LIMIT) {
        setTimeout(() => setShowPaywall(true), 1500);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: 'Lo siento, tuve un problema conectándome. Por favor intenta nuevamente. 💜',
        },
      ]);
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

  return (
    <div className="chat-page">
      <div className="chat-header" style={{ borderBottomColor: char.color + '30' }}>
        <button className="chat-back" onClick={() => onNavigate('select')}>←</button>
        <div className="chat-char-info">
          <div className="chat-avatar" style={{ background: char.gradient }}>{char.avatar}</div>
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
        {isPremium && <div className="premium-badge">✨ Premium</div>}
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role === 'user' ? 'message-user' : 'message-ai'}`}>
            {msg.role === 'assistant' && (
              <div className="message-avatar" style={{ background: char.gradient }}>
                {char.avatar}
              </div>
            )}
            <div
              className="message-bubble"
              style={msg.role === 'user' ? { background: char.gradient } : undefined}
            >
              {msg.content.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < msg.content.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message message-ai">
            <div className="message-avatar" style={{ background: char.gradient }}>
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

      {showPaywall && (
        <div className="paywall-overlay">
          <div className="paywall-card">
            <div className="paywall-avatar" style={{ background: char.gradient }}>
              {char.avatar}
            </div>
            <h3 className="paywall-title">Continúa con {char.name} 💜</h3>
            <p className="paywall-desc">
              Has usado tus {FREE_MESSAGE_LIMIT} mensajes gratuitos. Obtén acceso premium para chatear sin límites.
            </p>
            <div className="paywall-price">
              <span>S/ {char.price?.toFixed(2) || '29.90'}</span>
              <span className="price-month">/mes</span>
            </div>
            <button
              className="paywall-btn"
              style={{ background: char.gradient }}
              onClick={() => onNavigate('payment', { character: char })}
            >
              Obtener Premium → Pagar con Yape
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
            placeholder={`Escribe a ${char.name}...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            type="submit"
            className="send-btn"
            disabled={!input.trim() || loading}
            style={{ background: input.trim() ? char.gradient : undefined }}
          >
            ↑
          </button>
        </form>
      </div>
    </div>
  );
}
