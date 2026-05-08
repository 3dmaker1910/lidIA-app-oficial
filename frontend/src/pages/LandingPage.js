import React, { useEffect, useState } from 'react';
import './LandingPage.css';

const CHAR_IMAGES = {
  lidia: 'https://customer-assets.emergentagent.com/wingman/b09505ba-190e-4ca7-9d47-23f73249f18b/attachments/aab9c1dcf46c4119b7ddb9cb3e2cb27c_lidia.png',
  vivian: 'https://customer-assets.emergentagent.com/wingman/b09505ba-190e-4ca7-9d47-23f73249f18b/attachments/87db63e37c6746298803b64e39d2905c_vivian.png',
  mia: 'https://customer-assets.emergentagent.com/wingman/b09505ba-190e-4ca7-9d47-23f73249f18b/attachments/d2a6fa15868b49efabfdd6e8675d8f18_mia.png',
};

const characters = [
  { key: 'lidia', name: 'lidIA', tagline: 'Arquetipo Inteligente', color: '#8B5CF6', gradient: 'linear-gradient(135deg, #7C3AED, #EC4899)' },
  { key: 'vivian', name: 'Vivian', tagline: 'Arquetipo Fitness', color: '#EC4899', gradient: 'linear-gradient(135deg, #EC4899, #F97316)' },
  { key: 'mia', name: 'Mia', tagline: 'Arquetipo Dulce', color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)' },
];

const features = [
  { icon: '🧠', title: 'IA de última generación', desc: 'Powered by Llama 3 70B, el modelo más avanzado disponible' },
  { icon: '💜', title: 'Personajes únicos', desc: 'Elige entre lidIA, Vivian y Mia — cada una con su personalidad especial' },
  { icon: '📱', title: 'App nativa móvil', desc: 'Instala en tu teléfono como app con modo offline y notificaciones' },
  { icon: '🔒', title: 'Privacidad total', desc: 'Tus conversaciones son privadas y nunca se comparten con terceros' },
];

export default function LandingPage({ onNavigate }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  return (
    <div className={`landing ${visible ? 'visible' : ''}`}>
      <div className="landing-hero">
        <div className="hero-glow" />
        <div className="hero-content">
          <div className="hero-badge">✨ Inteligencia Artificial Premium</div>
          <h1 className="hero-title">
            <span className="title-main">lid</span>
            <span className="title-ia">IA</span>
          </h1>
          <p className="hero-subtitle">
            Tu compañera inteligente en español.<br />
            Conversaciones reales, sin límites.
          </p>

          {/* Character photo showcase */}
          <div className="hero-chars">
            {characters.map((c) => (
              <div key={c.key} className="hero-char-item" onClick={() => onNavigate('select')}>
                <div className="hero-char-ring" style={{ background: c.gradient }}>
                  <img
                    src={CHAR_IMAGES[c.key]}
                    alt={c.name}
                    className="hero-char-photo"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>
                <span className="hero-char-name" style={{ color: c.color }}>{c.name}</span>
                <span className="hero-char-tagline">{c.tagline}</span>
              </div>
            ))}
          </div>

          <div className="hero-actions">
            <button className="btn-primary" onClick={() => onNavigate('select')}>
              Comenzar ahora 💜
            </button>
            <button className="btn-secondary" onClick={() => onNavigate('select')}>
              Ver personajes
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-num">3</span>
              <span className="stat-label">Personajes</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-num">S/ 2</span>
              <span className="stat-label">por 12h</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-num">24/7</span>
              <span className="stat-label">Disponible</span>
            </div>
          </div>
        </div>
      </div>

      <div className="landing-features">
        <h2 className="features-title">¿Por qué lidIA?</h2>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="landing-cta">
        <div className="cta-card">
          <h2 className="cta-title">Empieza desde S/ 2.00</h2>
          <p className="cta-desc">Acceso premium por 12 horas. Paga con Yape al 986083251.</p>
          <button className="btn-primary btn-large" onClick={() => onNavigate('select')}>
            Elegir mi personaje →
          </button>
        </div>
      </div>
    </div>
  );
}
