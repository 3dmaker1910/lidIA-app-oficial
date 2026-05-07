import React, { useEffect, useState } from 'react';
import './LandingPage.css';

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
              <span className="stat-num">∞</span>
              <span className="stat-label">Mensajes</span>
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
          <h2 className="cta-title">Empieza desde S/ 24.90</h2>
          <p className="cta-desc">Acceso premium por mes. Cancela cuando quieras.</p>
          <button className="btn-primary btn-large" onClick={() => onNavigate('select')}>
            Elegir mi personaje →
          </button>
        </div>
      </div>
    </div>
  );
}
